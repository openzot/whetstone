/* Redline - the whetstone's one game, honed one facet per shift.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go.
 *
 * Pass 5 (looks): four passes in, the play had grown but the picture hadn't -
 * every car was still the same grey rectangle with a slot of windscreen,
 * nothing on screen said how fast you were going, and the loudest moment of
 * the game, the crash, cut straight to a menu: no impact, no debris, the
 * canvas freezing under an opaque report within a frame. Now the run looks
 * alive: cars are drawn - body, cabin glass, wheels, headlights and
 * taillights, a soft shadow under each, and a little paint variety in the
 * traffic; speed streaks stream down the tarmac, longer and brighter as the
 * ramp climbs; and a crash lands as something you SEE - a flash, an
 * expanding shockwave, spinning debris and sparks, half a second of camera
 * shake - with the report held back so the wreck plays out first. Nothing
 * but pixels changed: collisions, scoring, drift, ramp and audio all behave
 * exactly as version 4 did.
 *
 * Earlier passes kept: fair shoulders (1), engine and crash audio (2), the
 * winding road with centrifugal drift (3), close-pass chains (4).
 *
 * The fixed API every pass keeps (the probe drives the game through it):
 *   window.game = { name, state() -> {screen, score}, start(), reset() }
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
  // half-widths); a pass with clearance under CLOSE_MAX counts as "close",
  // and tighter is worth more.
  var CAR_GAP = 34;           // centre distance at which two cars touch
  var CLOSE_MAX = 20;         // px of clearance that still counts as "close"
  var STREAK_WINDOW = 3;      // seconds between close passes to keep a chain

  var TRAFFIC_PAINTS = ["#8a93a0", "#9aa7b8", "#b0a184", "#7d9c86", "#a4766a"];

  var screen = "title"; // title | playing | over
  var player, traffic, distance, speed, spawnTimer, lastTime, totalS;
  var score, closePasses, streak, streakT, bestStreak, pops;
  var keys = { left: false, right: false };


  /* --- crash presentation ---------------------------------------------------
   * The wreck is drawn, not just heard: particles, a shockwave ring, a flash
   * and decaying camera shake play out on the frozen scene before the report
   * slides in. Purely cosmetic - state() flips to "over" the instant you
   * hit, scoring stops, and start()/reset() sweep it all away. */
  var fx = null;            // { parts:[], ring, flash, shake } while a wreck animates
  var fxLast = null;        // timestamp for the wreck's own frame loop
  var overDelayTimer = null;

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
    clearCrashFx();
    init();
    setScreen("playing");
    startEngine();
    lastTime = null;
    requestAnimationFrame(frame);
  }


  function reset() {
    stopEngine(false);
    clearCrashFx();
    init();
    setScreen("title");
    draw();
  }

  // The wreck: state() flips to "over" right now, but the report is held
  // back ~0.75s so the crash is something you SEE - flash, shockwave, debris
  // and a shudder - instead of an instant menu swap. start()/reset() cancel
  // the pending report so it can never pop up over a fresh run.
  function crash() {
    stopEngine(true);
    crashSound();
    finalScoreEl.textContent = String(Math.floor(score));
    finalDetailEl.textContent =
      Math.floor(distance) + " m \u00b7 " + closePasses +
      (closePasses === 1 ? " close pass" : " close passes") +
      (bestStreak > 1 ? " \u00b7 best chain x" + Math.min(bestStreak, 5) : "");
    screen = "over";
    titleScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    spawnWreck();
    if (overDelayTimer) clearTimeout(overDelayTimer);
    overDelayTimer = setTimeout(function () {
      overDelayTimer = null;
      if (screen === "over") overScreen.classList.remove("hidden");
    }, 750);
    fxLast = null;
    requestAnimationFrame(overFrame);
  }

  function clearCrashFx() {
    fx = null;
    fxLast = null;
    if (overDelayTimer) {
      clearTimeout(overDelayTimer);
      overDelayTimer = null;
    }
  }

  // Debris, sparks, one expanding ring, a flash and a decaying shake.
  function spawnWreck() {
    var parts = [];
    var paints = ["#e04a3a", "#2b2f36", "#10131a"];
    var i, ang;
    for (i = 0; i < 14; i++) {           // tumbling wreckage in the car's colours
      ang = Math.random() * Math.PI * 2;
      parts.push({
        kind: "debris",
        x: W / 2 + roadCenter(totalS) + player.u,
        y: PLAYER_Y,
        vx: Math.cos(ang) * (40 + Math.random() * 190),
        vy: Math.sin(ang) * (40 + Math.random() * 190) - 60,
        rot: Math.random() * Math.PI,
        spin: (Math.random() * 2 - 1) * 9,
        size: 4 + Math.random() * 5,
        paint: paints[Math.floor(Math.random() * paints.length)],
        t: 0.85 + Math.random() * 0.35
      });
    }
    for (i = 0; i < 22; i++) {           // bright short-lived sparks
      ang = Math.random() * Math.PI * 2;
      parts.push({
        kind: "spark",
        x: W / 2 + roadCenter(totalS) + player.u,
        y: PLAYER_Y,
        vx: Math.cos(ang) * (120 + Math.random() * 320),
        vy: Math.sin(ang) * (120 + Math.random() * 320),
        size: 1 + Math.random() * 2,
        paint: Math.random() < 0.5 ? "#ffd75e" : "#ff9d4a",
        t: 0.25 + Math.random() * 0.35
      });
    }
    fx = { parts: parts, ring: 0.45, flash: 0.16, shake: 0.5 };
  }

  function drawWreck(dt) {
    var f = fx;
    f.ring = Math.max(0, f.ring - dt);
    f.flash = Math.max(0, f.flash - dt);
    f.shake = Math.max(0, f.shake - dt);
    var cx = W / 2 + roadCenter(totalS) + player.u;

    for (var i = f.parts.length - 1; i >= 0; i--) {
      var p = f.parts[i];
      p.t -= dt;
      if (p.t <= 0) { f.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.4 * dt;
      p.vy *= 1 - 2.4 * dt;
      ctx.globalAlpha = Math.min(1, p.t / 0.3);
      if (p.kind === "spark") {
        ctx.strokeStyle = p.paint;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else {
        if (p.rot !== undefined) p.rot += p.spin * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.paint;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    if (f.ring > 0) {                    // the shockwave
      var k = 1 - f.ring / 0.45;
      ctx.globalAlpha = f.ring / 0.45;
      ctx.strokeStyle = "#ffe9c9";
      ctx.lineWidth = 3 - 2 * k;
      ctx.beginPath();
      ctx.arc(cx, PLAYER_Y, 12 + k * 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (f.flash > 0) {                   // the impact itself, one bright beat
      ctx.globalAlpha = (f.flash / 0.16) * 0.55;
      ctx.fillStyle = "#fff3dc";
      ctx.fillRect(-20, -20, W + 40, H + 40);   // oversized: covers the shake offset
      ctx.globalAlpha = 1;
    }
  }

  // Keeps rendering while the wreck plays out; update() is not called, so
  // score and world stay frozen from the instant of contact.
  function overFrame(t) {
    if (screen !== "over") return;
    if (!fx) return;                     // effects swept: stop drawing
    if (fxLast == null) fxLast = t;
    var dt = Math.min((t - fxLast) / 1000, 0.05);
    fxLast = t;
    var sx = 0, sy = 0;
    if (fx.shake > 0 && !document.hidden) {
      sx = (Math.random() * 2 - 1) * 8 * fx.shake;
      sy = (Math.random() * 2 - 1) * 6 * fx.shake;
    }
    ctx.save();
    ctx.translate(sx, sy);
    draw();
    drawWreck(dt);
    ctx.restore();
    requestAnimationFrame(overFrame);
  }

  function spawn() {
    var lane = Math.floor(Math.random() * LANES);
    traffic.push({
      u: laneU(lane),
      s: totalS + 700,                  // spawns beyond the top of the screen
      w: 34,
      h: 58,
      vy: speed * (0.45 + Math.random() * 0.25), // slower than you: you overtake
      prevRel: undefined,
      paint: TRAFFIC_PAINTS[Math.floor(Math.random() * TRAFFIC_PAINTS.length)]
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

  // A car, drawn: soft shadow, wheels poking out, rounded body, cabin glass

  // front and rear, headlights at the nose and taillights at the tail. Same
  // footprint as ever - this changes only what you SEE. The player's red is
  // kept and given a pale racing stripe so it stays instantly yours.
  function drawCar(u, s, w, h, body, isPlayer) {
    var x = W / 2 + roadCenter(s) + u;
    var y = PLAYER_Y - (s - totalS);
    if (y < -h || y > H + h) return;

    // shadow: a soft dark slip offset down-right, grounding the car
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#06080a";
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 5, w * 0.62, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    function rr(px, py, pw, ph, r) {       // rounded rect path
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + pw, py, px + pw, py + ph, r);
      ctx.arcTo(px + pw, py + ph, px, py + ph, r);
      ctx.arcTo(px, py + ph, px, py, r);
      ctx.arcTo(px, py, px + pw, py, r);
      ctx.closePath();
    }

    // wheels: dark stubs just outside the body sides
    ctx.fillStyle = "#101216";
    ctx.fillRect(x - w / 2 - 2.5, y - h / 2 + 7, 4, 12);
    ctx.fillRect(x + w / 2 - 1.5, y - h / 2 + 7, 4, 12);
    ctx.fillRect(x - w / 2 - 2.5, y + h / 2 - 19, 4, 12);
    ctx.fillRect(x + w / 2 - 1.5, y + h / 2 - 19, 4, 12);

    // body
    ctx.fillStyle = body;
    rr(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    // nose and tail shading so the slab reads as sheet metal
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    rr(x - w / 2 + 2, y - h / 2 + 2, w - 4, 8, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    rr(x - w / 2 + 2, y + h / 2 - 9, w - 4, 7, 4);
    ctx.fill();

    // cabin: darker roof between two bands of glass
    var cabW = w - 9;
    ctx.fillStyle = shade(body, isPlayer ? 0.72 : 0.78);
    rr(x - cabW / 2, y - 11, cabW, 22, 4);
    ctx.fill();
    ctx.fillStyle = "#aebfd2";             // windscreen, catching the sky
    rr(x - cabW / 2 + 1, y - 15, cabW - 2, 6, 2);
    ctx.fill();
    ctx.fillStyle = "#8fa1b5";             // rear window
    rr(x - cabW / 2 + 1, y + 9, cabW - 2, 5, 2);
    ctx.fill();

    if (isPlayer) {                        // the racing stripe
      ctx.fillStyle = "rgba(240,240,235,0.85)";
      ctx.fillRect(x - 2.5, y - h / 2 + 3, 5, 10);
      ctx.fillRect(x - 2.5, y + h / 2 - 13, 5, 10);
    }

    // lights: pale at the nose, red at the tail (traffic runs the same way)
    ctx.fillStyle = "#ffe9b0";
    ctx.fillRect(x - w / 2 + 3, y - h / 2 + 1, 6, 3);
    ctx.fillRect(x + w / 2 - 9, y - h / 2 + 1, 6, 3);
    ctx.fillStyle = isPlayer ? "#ff5d49" : "#c93b2e";
    ctx.fillRect(x - w / 2 + 3, y + h / 2 - 4, 6, 3);
    ctx.fillRect(x + w / 2 - 9, y + h / 2 - 4, 6, 3);
  }

  // Darken a hex colour by a fraction - for roof tones off the body paint.
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * k);
    var g = Math.round(((n >> 8) & 255) * k);
    var b = Math.round((n & 255) * k);
    return "rgb(" + r + "," + g + "," + b + ")";
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
    // mown verge banding: broad alternate stripes scrolling with the world,
    // barely there but they make the green read as ground, not flat paint
    var bandP = 260;
    for (var b = Math.floor(minS / bandP); b * bandP <= maxS; b++) {
      if (((b % 2) + 2) % 2 !== 0) continue;
      var bEnd = Math.min(maxS, (b + 1) * bandP);
      ribbon(-HALF - 60, b * bandP, bEnd, 60, "rgba(0,0,0,0.055)");
      ribbon(HALF, b * bandP, bEnd, 60, "rgba(0,0,0,0.055)");
    }

    drawScenery(minS, maxS);

    ribbon(-HALF, minS, maxS, HALF, "#23262b");          // tarmac

    ribbon(-HALF, minS, maxS, 2, "#c8ccd2");             // painted edges
    ribbon(HALF, minS, maxS, 2, "#c8ccd2");

    ctx.fillStyle = "#555c66";                           // dashed lane lines
    // speed made visible: pale streaks stream down the tarmac, longer and
    // brighter as the ramp climbs - barely there when fresh, unmistakable
    // near top speed, so the pace you have worked up to is something you see
    var ramp = Math.max(0, Math.min(1, (speed - 238) / 190));
    if (ramp > 0.02 && screen === "playing") {
      var sp = 84;
      ctx.strokeStyle = "#e8edf3";
      ctx.lineWidth = 2;
      for (var q = Math.floor((minS - 120) / sp); q * sp <= maxS + 120; q++) {
        if (hash(q * 31 + 7) < 0.25) continue;           // not every slot
        var ss = q * sp + hash(q * 13 + 11) * 50;
        var uu = (hash(q * 17 + 3) * 2 - 1) * (HALF - 16);
        var ln = 14 + ramp * 66 * (0.5 + hash(q * 23 + 5));
        var yQ = PLAYER_Y - (ss - totalS);
        if (yQ < -100 || yQ > H + 100) continue;
        ctx.globalAlpha = ramp * (0.16 + 0.14 * hash(q * 7 + 5));
        ctx.beginPath();
        ctx.moveTo(W / 2 + roadCenter(ss) + uu, yQ - ln);
        ctx.lineTo(W / 2 + roadCenter(ss) + uu, yQ);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    var ramp = Math.max(0, Math.min(1, (speed - 250) / 230));
    if (ramp > 0.02 && screen === "playing") {
      var sp = 84;
      ctx.strokeStyle = "#e8edf3";
      ctx.lineWidth = 2;
      for (var q = Math.floor((minS - 120) / sp); q * sp <= maxS + 120; q++) {
        if (hash(q * 31 + 7) < 0.25) continue;           // not every slot
        var ss = q * sp + hash(q * 13 + 11) * 50;
        var uu = (hash(q * 17 + 3) * 2 - 1) * (HALF - 16);
        var ln = 16 + ramp * 60 * (0.5 + hash(q * 23 + 5));
        var yQ = PLAYER_Y - (ss - totalS);
        if (yQ < -90 || yQ > H + 90) continue;
        ctx.globalAlpha = ramp * (0.12 + 0.12 * hash(q * 7 + 5));
        ctx.beginPath();
        ctx.moveTo(W / 2 + roadCenter(ss) + uu, yQ - ln);
        ctx.lineTo(W / 2 + roadCenter(ss) + uu, yQ);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (var i = 0; i < traffic.length; i++) {
      drawCar(traffic[i].u, traffic[i].s, traffic[i].w, traffic[i].h,
        traffic[i].paint || "#8a93a0", false);
    }
    drawCar(player.u, totalS, player.w, player.h, "#e04a3a", true);


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
    if (screen === "playing" && streak > 1 && streakT > 0) {
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
