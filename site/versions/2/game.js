/* Redline - the whetstone's one game, as it came off the casting bench.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go. Deliberately rough: no sound, no juice, flat art,
 * a bare difficulty ramp. Every shift hones one facet and records the pass
 * in the ledger.
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
  var finalScoreEl = document.getElementById("final-score");

  var W = canvas.width;
  var H = canvas.height;

  var ROAD_X = 60;            // verge width either side
  var ROAD_W = W - ROAD_X * 2;
  var LANES = 3;
  var LANE_W = ROAD_W / LANES;

  var screen = "title"; // title | playing | over
  var player, traffic, distance, speed, spawnTimer, dashOffset, lastTime;
  var keys = { left: false, right: false };

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

  function laneCenter(i) {
    return ROAD_X + LANE_W * i + LANE_W / 2;
  }

  function init() {
    player = { x: laneCenter(1), y: H - 90, w: 34, h: 58, steer: 300 };
    traffic = [];
    distance = 0;       // metres covered
    speed = 220;        // your road speed, px/s - climbs over time
    spawnTimer = 0.8;
    dashOffset = 0;
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
    finalScoreEl.textContent = String(Math.floor(distance));
    setScreen("over");
  }

  function spawn() {
    var lane = Math.floor(Math.random() * LANES);
    traffic.push({
      x: laneCenter(lane),
      y: -70,
      w: 34,
      h: 58,
      vy: speed * (0.45 + Math.random() * 0.25) // slower than you: you overtake
    });
  }

  function update(dt) {
    speed += 6 * dt;                    // the ramp: ever faster
    distance += speed * dt * 0.15;      // px to metres, roughly
    dashOffset = (dashOffset + speed * dt) % 48;

    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    player.x += dir * player.steer * dt;
    // clamp well inside the painted edge: the old 4px margin let the car ride
    // the white line outside the outermost lane's collision envelope, where
    // lane-3 traffic (centred at x=360, |dx| < 34 to hit) could never reach it
    var lo = ROAD_X + player.w / 2 + 16;
    var hi = W - ROAD_X - player.w / 2 - 16;
    if (player.x < lo) player.x = lo;
    if (player.x > hi) player.x = hi;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(0.35, 1.1 - distance * 0.0004);
    }

    for (var i = traffic.length - 1; i >= 0; i--) {
      var c = traffic[i];
      c.y += (speed - c.vy) * dt;       // relative: traffic drifts toward you
      if (c.y - c.h / 2 > H) {
        traffic.splice(i, 1);
        continue;
      }
      if (
        Math.abs(c.x - player.x) < (c.w + player.w) / 2 &&
        Math.abs(c.y - player.y) < (c.h + player.h) / 2
      ) {
        crash();
        return;
      }
    }

    scoreEl.textContent = String(Math.floor(distance));
  }

  function drawCar(x, y, w, h, body) {
    ctx.fillStyle = body;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = "#0e1013";
    ctx.fillRect(x - w / 2 + 5, y - h / 2 + 10, w - 10, 12); // windscreen
  }

  function draw() {
    // verges and road
    ctx.fillStyle = "#181d16";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#23262b";
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    ctx.fillStyle = "#c8ccd2";
    ctx.fillRect(ROAD_X - 4, 0, 4, H);
    ctx.fillRect(W - ROAD_X, 0, 4, H);

    // dashed lane lines, scrolling with the road
    ctx.fillStyle = "#555c66";
    for (var l = 1; l < LANES; l++) {
      var x = ROAD_X + LANE_W * l - 2;
      for (var y = -48 + dashOffset; y < H; y += 48) {
        ctx.fillRect(x, y, 4, 24);
      }
    }

    for (var i = 0; i < traffic.length; i++) {
      drawCar(traffic[i].x, traffic[i].y, traffic[i].w, traffic[i].h, "#8a93a0");
    }
    drawCar(player.x, player.y, player.w, player.h, "#e04a3a");
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
      return { screen: screen, score: Math.floor(distance) };
    },
    start: start,
    reset: reset
  };

  init();
  draw();
})();
