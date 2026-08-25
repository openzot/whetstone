/* Redline - the whetstone's one game, honed one facet per shift.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go.
 *
 * Pass 4 (depth): surviving was the only thing that scored, so the sensible
 * way to play was timid - every overtake, however brave, paid nothing. Now
 * shaving past traffic pays: a close pass is worth up to 100 points scaled
 * by how little clearance was left, and close passes within three seconds of
 * each other chain into a multiplier up to x5, so threading a gap outscores
 * the cautious lane. The HUD keeps points and metres, each pass pops its
 * value where it happened, and the crash report tells the run's story.
 *
 * Earlier passes kept: fair shoulders (1), engine and crash audio (2), the
 * winding road with centrifugal drift (3).
 *
 * The fixed API every pass keeps (the probe drives the game through it):
 *   window.game = { name, state() -> {screen, score}, start(), reset() }
 */
(function () {
  "use strict";

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var titleScreen = document.getElementById("title-screen");
  var overScreen = document.getElementById("over-screen");
  var scoreEl = document.getElementById("score");
  var distEl = document.getElementById("dist");
  var finalScoreEl = document.getElementById("final-score");
  var finalDetailEl = document.getElementById("final-detail");

  var W = canvas.width;
  var H = canvas.height;

  var ROAD_W = W - 60 * 2;    // painted width; 60px of verge either side
  var LANES = 3;
  var LANE_W = ROAD_W / LANES;
  var HALF = ROAD_W / 2;
  var PLAYER_Y = H - 90;      // the car sits here; the world scrolls past

  // Close-pass scoring: contact is at centre distance CAR_GAP (the two
  // half-widths); a pass with clearance under CLOSE_MAX counts as close,
  // and tighter is worth more.
  var CAR_GAP = 34;           // centre distance at which two cars touch
  var CLOSE_MAX = 20;         // px of clearance that still counts as "close"
  var STREAK_WINDOW = 3;      // seconds between close passes to keep a chain

  var screen = "title"; // title | playing | over
  var player, traffic, distance, speed, spawnTimer, lastTime, totalS;
  var score, closePasses, streak, streakT, bestStreak, pops;
  var keys = { left: false, right: false };

  /* --- the road itself -----------------------------------------------------
   * The centreline is a pure function of world distance s (px travelled), so
   * anything on the road - car, truck, dash, post - can ask "where is the
   * road at my s?" and sit on the bend. Layered sines: long lazy sweep plus
   * a tighter shorter one, so stretches of near-straight alternate with real
   * bends instead of one metronome wiggle. */
  function roadCenter(s) {
    return Math.sin(s * 0.0016) * 70 + Math.sin(s * 0.00071 + 1.3) * 46;
  }
  // d(centre)/ds - how hard the road leans right now; also the slope the car
  // fights when it should be holding the bend (centrifugal drift).
  function roadSlope(s) {
    return 70 * 0.0016 * Math.cos(s * 0.0016) +
           46 * 0.00071 * Math.cos(s * 0.00071 + 1.3);
  }

  /* --- audio: the engine and the crash, synthesised with Web Audio -------
   * Everything here is defensive: if AudioContext is missing or blocked the
   * game plays exactly as before, only silent. The context is created on the
   * first user gesture so autoplay policies never stall the run. */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null;        // the context, made lazily
  var master = null;    // everything routes through this
  var engine = null;    // { o1, o2, g } while the car runs

  function ensureAudio() {
    if (!AC || ac) return;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
    } catch (e) {
      ac = null;
    }
  }

  function resumeAudio() {
    ensureAudio();
    if (ac && ac.state === "suspended" && ac.resume) {
      ac.resume().catch(function () {});
    }
  }

  // Idle ~65 Hz sweeping to ~120 Hz per gear; each 80 px/s of ramp is one
  // gear, so the pitch climbs then drops back - audible shifts as it speeds up.
  function engineFreq() {
    var gearLen = 80;
    var k = Math.max(0, (speed - 220) / gearLen);
    var frac = k - Math.floor(k);
    return 65 + frac * 55;
  }

  function startEngine() {
    resumeAudio();
    if (!ac || engine) return;
    try {
      var now = ac.currentTime;
      var o1 = ac.createOscillator();       // the raspy top end
      o1.type = "sawtooth";
      var o2 = ac.createOscillator();       // an octave below, for thickness
      o2.type = "square";
      var f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 800;
      f.Q.value = 2;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.14, now + 0.25); // engine catching
      o1.frequency.setValueAtTime(40, now); // ignition rev: sweep up to idle
      o1.frequency.linearRampToValueAtTime(engineFreq(), now + 0.35);
      o2.frequency.setValueAtTime(20, now);
      o2.frequency.linearRampToValueAtTime(engineFreq() / 2, now + 0.35);
      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(master);
      o1.start(now);
      o2.start(now);
      engine = { o1: o1, o2: o2, g: g };
    } catch (e) {
      engine = null;
    }
  }

  function stopEngine(cut) {
    if (!ac || !engine) return;
    try {
      var now = ac.currentTime;
      var tail = cut ? 0.04 : 0.25;         // crash kills it near-instantly
      engine.g.gain.cancelScheduledValues(now);
      engine.g.gain.setValueAtTime(Math.max(0.0001, engine.g.gain.value), now);
      engine.g.gain.exponentialRampToValueAtTime(0.0001, now + tail);
      engine.o1.stop(now + tail + 0.05);
      engine.o2.stop(now + tail + 0.05);
    } catch (e) {
      /* already gone */
    }
    engine = null;
  }

  // Track the ramp: retune the running engine toward the current rpm.
  function tuneEngine() {
    if (!ac || !engine) return;
    try {
      var t = ac.currentTime;
      var hz = engineFreq();
      engine.o1.frequency.setTargetAtTime(hz, t, 0.06);
      engine.o2.frequency.setTargetAtTime(hz / 2, t, 0.06);
    } catch (e) {
      /* keep playing silently rather than break */
    }
  }

  function crashSound() {
    if (!ac) return;
    try {
      var now = ac.currentTime;
      var dur = 0.5;
      var buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      }
      var src = ac.createBufferSource();
      src.buffer = buf;
      var f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(2400, now);
      f.frequency.exponentialRampToValueAtTime(150, now + dur);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.55, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(now);

      var o = ac.createOscillator();        // the low thump under the crunch
      o.type = "sine";
      o.frequency.setValueAtTime(150, now);
      o.frequency.exponentialRampToValueAtTime(38, now + 0.35);
      var og = ac.createGain();
      og.gain.setValueAtTime(0.5, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.connect(og);
      og.connect(master);
      o.start(now);
      o.stop(now + 0.45);
    } catch (e) {
      /* stay silent rather than break */
    }
  }

  function laneU(i) {
    return -HALF + LANE_W * i + LANE_W / 2;
  }

  function init() {
    player = { u: 0, w: 34, h: 58, steer: 300 };   // u = offset from centreline
    traffic = [];
    distance = 0;       // metres covered
    totalS = 0;         // world px travelled - everything hangs off this
    speed = 220;        // your road speed, px/s - climbs over time
    spawnTimer = 0.8;
    score = 0;          // points: metres survived plus close-pass bonuses
    closePasses = 0;
    streak = 0;         // consecutive close passes inside STREAK_WINDOW
    streakT = 0;        // seconds left before the chain dies
    bestStreak = 0;
    pops = [];          // floating "+N xM" markers where passes happened
  }

  // Worth of one close pass: no clearance -> 100 pts, CLOSE_MAX -> 20 pts.
  function closeBonus(clear) {
    return 20 + Math.round((1 - clear / CLOSE_MAX) * 80);
  }

  function setScreen(next) {
    screen = next;
    titleScreen.classList.toggle("hidden", next !== "title");
    overScreen.classList.toggle("hidden", next !== "over");
  }

  function start() {
    if (screen === "playing") return;
    init();
    setScreen("playing");
    startEngine();
    lastTime = null;
    requestAnimationFrame(frame);
  }

  function reset() {
    stopEngine(false);
    init();
    setScreen("title");
    draw();
  }

  function crash() {
    stopEngine(true);
    crashSound();
    finalScoreEl.textContent = String(Math.floor(score));
    finalDetailEl.textContent =
      Math.floor(distance) + " m \u00b7 " + closePasses +
      (closePasses === 1 ? " close pass" : " close passes") +
      (bestStreak > 1 ? " \u00b7 best chain x" + Math.min(bestStreak, 5) : "");
    setScreen("over");
  }

  function spawn() {
    var lane = Math.floor(Math.random() * LANES);
    traffic.push({
      u: laneU(lane),
      s: totalS + 700,                  // spawns beyond the top of the screen
      w: 34,
      h: 58,
      vy: speed * (0.45 + Math.random() * 0.25), // slower than you: you overtake
      prevRel: undefined
    });
  }

  function update(dt) {
    speed += 6 * dt;                    // the ramp: ever faster
    var ds = speed * dt;
    distance += ds * 0.15;              // px to metres, roughly
    totalS += ds;
    score += ds * 0.15;                 // survival pays its base rate: 1 pt/m

    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    player.u += dir * player.steer * dt;
    // centrifugal drift: the car slides toward the outside of a bend in
    // proportion to how hard the road leans and how fast you take it -
    // negligible at 220 px/s, a shove you must counter-steer at top speed
    player.u -= roadSlope(totalS) * speed * 0.85 * dt;
    // clamp well inside the painted edge: the old 4px margin let the car ride
    // the white line outside the outermost lane's collision envelope, where
    // lane-3 traffic could never reach it (shift 1)
    var lim = HALF - player.w / 2 - 16;
    if (player.u < -lim) player.u = -lim;
    if (player.u > lim) player.u = lim;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.35, 1.1 - distance * 0.0004);
    }

    // a live chain ticks down and dies if you stop passing close
    if (streakT > 0) {
      streakT -= dt;
      if (streakT <= 0) streak = 0;
    }

    for (var i = traffic.length - 1; i >= 0; i--) {
      var c = traffic[i];
      c.s += c.vy * dt;                 // they drive too, just slower
      var rel = c.s - totalS;           // +ahead of you / -behind you

      // Close pass: the moment a car's nose crosses your tail (rel flips
      // from ahead to behind through zero), judge how much room was left.
      // Road coordinates again - lateral clearance in u, not screen x, so
      // a bend cannot fake or hide a close shave.
      if (c.prevRel !== undefined && c.prevRel > 0 && rel <= 0) {
        var clear = Math.abs(c.u - player.u) - CAR_GAP;
        if (clear < CLOSE_MAX) {
          closePasses += 1;
          streak = streakT > 0 ? streak + 1 : 1;
          streakT = STREAK_WINDOW;
          if (streak > bestStreak) bestStreak = streak;
          var mult = Math.min(streak, 5);
          var pts = closeBonus(Math.max(0, clear)) * mult;
          score += pts;
          pops.push({
            u: c.u, s: c.s,             // where it happened, on the road
            text: "+" + pts + (mult > 1 ? " x" + mult : ""),
            t: 0.9                      // seconds left on screen
          });
        }
      }
      c.prevRel = rel;

      if (rel < -160) {
        traffic.splice(i, 1);
        continue;
      }
      // contact test in road coordinates: lateral gap and nose-to-tail gap,
      // which stays correct through a bend where screen-x would lie
      if (
        Math.abs(c.u - player.u) < (c.w + player.w) / 2 &&
        Math.abs(rel) < (c.h + player.h) / 2
      ) {
        crash();
        return;
      }
    }

    for (var p = pops.length - 1; p >= 0; p--) {
      pops[p].t -= dt;
      if (pops[p].t <= 0) pops.splice(p, 1);
    }

    scoreEl.textContent = String(Math.floor(score));
    distEl.textContent = String(Math.floor(distance));
  }

  function drawCar(u, s, w, h, body) {
    var x = W / 2 + roadCenter(s) + u;
    var y = PLAYER_Y - (s - totalS);
    ctx.fillStyle = body;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = "#0e1013";
    ctx.fillRect(x - w / 2 + 5, y - h / 2 + 10, w - 10, 12); // windscreen
  }

  // One ribbon of road furniture: a filled strip following the centreline
  // between sA and sB, offset u from it, half-width hw across.
  function ribbon(u, sFrom, sTo, hw, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    var steps = Math.max(1, Math.ceil(Math.abs(sTo - sFrom) / 32));
    for (var i = 0; i <= steps; i++) {
      var s = sFrom + ((sTo - sFrom) * i) / steps;
      var x = W / 2 + roadCenter(s) + u - hw;
      var y = PLAYER_Y - (s - totalS);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (var j = steps; j >= 0; j--) {
      var s2 = sFrom + ((sTo - sFrom) * j) / steps;
      ctx.lineTo(W / 2 + roadCenter(s2) + u + hw, PLAYER_Y - (s2 - totalS));
    }
    ctx.closePath();
    ctx.fill();
  }

  // Deterministic scatter for the trees, so the forest is stable while the
  // world streams past under it.
  function hash(n) {
    n = (n << 13) ^ n;
    return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
  }

  function drawScenery(minS, maxS) {
    // delineator posts hugging both edges, every 150px of road
    var p = 150;
    for (var k = Math.floor(minS / p); k * p <= maxS; k++) {
      var sp = k * p;
      var py = PLAYER_Y - (sp - totalS);
      var px = W / 2 + roadCenter(sp);
      ctx.fillStyle = "#aab0b8";
      ctx.fillRect(px - HALF - 18, py - 7, 4, 14);
      ctx.fillRect(px + HALF + 14, py - 7, 4, 14);
    }
    // trees on the verge: two staggered strands, one per side, with gaps
    var t = 330;
    for (var m = Math.floor((minS - 400) / t); m * t <= maxS + 400; m++) {
      if (hash(m) < 0.25) continue;               // a clearing now and then
      var sl = m * t + hash(m * 3 + 1) * 200;
      if (sl >= minS && sl <= maxS) {
        var xl = W / 2 + roadCenter(sl) - HALF - 52 - hash(m * 7 + 2) * 60;
        var yl = PLAYER_Y - (sl - totalS);
        ctx.fillStyle = "#202b19";
        ctx.beginPath();
        ctx.arc(xl, yl, 13 + hash(m * 11 + 3) * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      var sr = m * t + 165 + hash(m * 5 + 4) * 200;
      if (sr >= minS && sr <= maxS) {
        var xr = W / 2 + roadCenter(sr) + HALF + 52 + hash(m * 13 + 5) * 60;
        var yr = PLAYER_Y - (sr - totalS);
        ctx.fillStyle = "#1c2617";
        ctx.beginPath();
        ctx.arc(xr, yr, 12 + hash(m * 17 + 6) * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function draw() {
    var minS = totalS - (H - PLAYER_Y) - 30;   // just below the bottom edge
    var maxS = totalS + PLAYER_Y + 30;         // just above the top edge

    // verges, then the life on them, then the road over both
    ctx.fillStyle = "#181d16";
    ctx.fillRect(0, 0, W, H);
    drawScenery(minS, maxS);
    ribbon(-HALF, minS, maxS, HALF, "#23262b");          // tarmac

    ribbon(-HALF, minS, maxS, 2, "#c8ccd2");             // painted edges
    ribbon(HALF, minS, maxS, 2, "#c8ccd2");

    ctx.fillStyle = "#555c66";                           // dashed lane lines
    var period = 48;
    for (var l = 1; l < LANES; l++) {
      var ub = -HALF + LANE_W * l;
      for (var k = Math.floor(minS / period); k * period <= maxS; k++) {
        var sA = k * period;                             // dash covers [sA,sA+24)
        var yT = PLAYER_Y - (sA + 24 - totalS);
        var yB = PLAYER_Y - (sA - totalS);
        if (yB < -30 || yT > H + 30) continue;
        var xT = W / 2 + roadCenter(sA + 24) + ub;
        var xB = W / 2 + roadCenter(sA) + ub;
        ctx.beginPath();
        ctx.moveTo(xT - 2, yT);
        ctx.lineTo(xT + 2, yT);
        ctx.lineTo(xB + 2, yB);
        ctx.lineTo(xB - 2, yB);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (var i = 0; i < traffic.length; i++) {
      drawCar(traffic[i].u, traffic[i].s, traffic[i].w, traffic[i].h, "#8a93a0");
    }
    drawCar(player.u, totalS, player.w, player.h, "#e04a3a");

    // close-pass markers: "+120 x3" drifting up from where the pass happened
    for (var pi = 0; pi < pops.length; pi++) {
      var pop = pops[pi];
      var rise = (1 - pop.t / 0.9) * 26;
      ctx.globalAlpha = Math.min(1, pop.t / 0.35);
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd75e";
      ctx.fillText(pop.text,
        W / 2 + roadCenter(pop.s) + pop.u,
        PLAYER_Y - (pop.s - totalS) - 34 - rise);
    }
    ctx.globalAlpha = 1;

    // the live chain ticking down under the score: reach another car before
    // the bar empties or the multiplier is gone - that is the decision
    if (streak > 1 && streakT > 0) {
      var frac = streakT / STREAK_WINDOW;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "#e04a3a";
      ctx.fillText("chain x" + Math.min(streak, 5), W - 12, 46);
      ctx.fillStyle = "#7d423c";
      ctx.fillRect(W - 12 - 64 * frac, 52, 64 * frac, 3);
    }
  }

  function frame(t) {
    if (screen !== "playing") return;
    if (lastTime == null) lastTime = t;
    var dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (!document.hidden) {
      update(dt);
      if (screen !== "playing") return;
      tuneEngine();
      draw();
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = true;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = true;
    if ((ev.key === " " || ev.key === "Enter") && screen !== "playing") start();
    resumeAudio(); // any key counts as the gesture that may unlock sound
  });
  document.addEventListener("keyup", function (ev) {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = false;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = false;
  });

  function touchDir(ev) {
    keys.left = false;
    keys.right = false;
    for (var i = 0; i < ev.touches.length; i++) {
      var half = ev.touches[i].clientX < window.innerWidth / 2;
      if (half) keys.left = true;
      else keys.right = true;
    }
  }
  canvas.addEventListener("touchstart", function (ev) { ev.preventDefault(); resumeAudio(); touchDir(ev); }, { passive: false });
  canvas.addEventListener("touchmove", function (ev) { ev.preventDefault(); touchDir(ev); }, { passive: false });
  canvas.addEventListener("touchend", function (ev) { touchDir(ev); });

  document.getElementById("start-button").addEventListener("click", start);
  document.getElementById("restart-button").addEventListener("click", start);

  window.game = {
    name: "Redline",
    state: function () {
      return { screen: screen, score: Math.floor(score) };
    },
    start: start,
    reset: reset
  };

  init();
  draw();
})();
