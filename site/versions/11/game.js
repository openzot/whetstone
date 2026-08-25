/* Redline - the whetstone's one game, honed one facet per shift.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go.
 *
 * Pass 11 (world): the road had been given bends, a day clock and other
 * road users - but the sky never did anything else. Every metre of every
 * drive was bone-dry: the tarmac wore the same sheen at midnight as at noon,
 * lamps never caught standing water, and the only thing that changed
 * overhead was the light itself. Now weather fronts roll through: rain is a
 * pure function of world distance, exactly like the centreline and the day
 * cycle, so every run walks the same fronts - a dry start, then a front
 * rolls in, holds a good stretch of proper rain, and eases away again. In
 * the wet the tarmac darkens glassy, every tail-light smears into a
 * vertical reflection on the standing water (hotter at night), your own
 * beam swells in the spray, a cool mist deepens off-lamp, and slanted
 * streaks fall across the whole canvas. Nothing about collisions, spawning,
 * steering, scoring rates, audio or the clock moved; the rain is the world,
 * not the physics.
 *
 * Pass 10 (audio): nine passes built a scoring language nobody could hear.
 * A tight shave pays up to a hundred points, chains multiply it five-fold -

 * and in an instrumented drive of version 9 every one of those moments, from
 * the first +20 to a x5 chain ringing in and starving out, happened in total
 * silence: since pass 2 the only voices in the game were the engine drone
 * and the crash crunch. Now the run has its ear back: a close pass shears
 * past as a band of air, panned to the flank it happened on and hotter the
 * tighter the shave; each link of a live chain rings two notes a step higher
 * than the last, so you can hear which multiplier you are riding; and when
 * the chain bar runs dry you get one dry warning tick before a low blip lays
 * the multiplier to rest. All synthesised through the same lazily-made
 * AudioContext, all guarded, silent-safe. Nothing about collisions,
 * spawning, steering, drawing, scoring rates or the clock moved.
 *
 * Pass 9 (world): the road had been given bends, day and night - but every

 * vehicle on it was still the seed's one actor: the same 34x58 sedan at a
 * constant random cruise, holding its lane forever, five paints the only
 * difference between them; two could even materialise fused nose-to-tail in
 * one lane, and nothing ever changed lanes. The road now carries other road
 * users: box vans and slow lorries you plan around, sports cars that come
 * through quick, and drivers who indicate for a beat and then ease into the
 * next lane (watch the amber); spawns can no longer fuse onto each other or
 * complete a three-abreast wall, so the busier road stays honest. Clearance
 * for close passes is measured against each vehicle's own width, so shaving
 * a lorry is judged like shaving a car. Nothing about steering, braking,
 * scoring rates, sound or the clock moved.
 *
 * Pass 8 (depth): seven passes in, the driver still had exactly one verb -
 * steer. Forward pace was a metronome: +6 px/s every second whether the road
 * ahead was empty or walled, so the only decision left was which lane to die
 * in. Now there is a brake - Down/S on keys, both halves of the screen on
 * touch - that scrubs pace toward a 180 px/s floor while it is held and lets
 * the ramp climb again when released. It is priced in the game's own currencies:
 * metres slow with you (survival pays per metre), a live chain starves inside
 * three seconds of not passing, and the ramp makes you earn every point of
 * speed back - but bends shove less, steering bites relatively harder, and a
 * dense wave becomes somewhere to arrive slowly instead of a coin-flip death.
 * A km/h readout joined the HUD because a pace verb you cannot see is a verb
 * you cannot use. Nothing about spawning, collisions, scoring rates, drawing
 * or sound moved; everything that already listened to speed now listens to you.
 *
 * Earlier passes kept: fair shoulders (1), engine and crash audio (2), the
 * winding road with drift (3), close-pass chains (4), drawn cars, streaks
 * and the wreck (5), weighted steering with body roll (6), the day cycle (7),
 * the brake and km/h (8), the other road users (9).

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
  var speedEl = document.getElementById("speed");
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
  // and tighter is worth more. With traffic of mixed widths the gap is now
  // measured per vehicle - (its width + yours)/2 - which for a sedan pair
  // is exactly the old CAR_GAP, so sedan payouts are unchanged.
  var CAR_GAP = 34;           // centre distance at which two sedans touch
  var CLOSE_MAX = 20;         // px of clearance that still counts as "close"
  var STREAK_WINDOW = 3;      // seconds between close passes to keep a chain

  var TRAFFIC_PAINTS = ["#8a93a0", "#9aa7b8", "#b0a184", "#7d9c86", "#a4766a"];

  /* --- the other road users -------------------------------------------------
   * Nine passes went into the road and its light, but every vehicle on it
   * was still the seed's one actor: a 34x58 sedan at a constant cruise,
   * holding its lane forever, paint the only difference - two could even
   * materialise fused nose-to-tail in one lane, and no driver ever changed
   * lanes. Now the road carries different traffic:
   *   sedan - as ever, 45-70% of your pace when it appears;
   *   van   - taller box, a touch slower;
   *   lorry - the slow wall you plan around: long, wide, 33-43%;
   *   sport - lower, quick: comes through at 62-78% (capped below 85% so it
   *           can never escape up the road).
   * Sedans and vans think: some signal amber for a beat, then ease into an
   * adjacent lane if there is room - never into you without warning, and
   * they abort back if the door closes mid-move. Spawns keep their integrity:
   * nothing fuses onto same-lane traffic, and a lane whose neighbours are
   * both already covered stays empty, so three-abreast walls cannot be
   * completed by a spawn. */
  var TYPES = {
    sedan: { w: 34, h: 58 },
    van:   { w: 38, h: 70 },
    lorry: { w: 40, h: 86 },
    sport: { w: 32, h: 54 }
  };
  // cruise fractions of your speed at the moment each vehicle appears ahead
  var CRUISE = {
    sedan: [0.45, 0.25],
    van:   [0.38, 0.14],
    lorry: [0.33, 0.10],
    sport: [0.62, 0.16]
  };
  var LORRY_PAINTS = ["#b9bdc4", "#a7adb6", "#c2b49a"];
  var SPORT_PAINTS = ["#3e6fa4", "#b8893b", "#59516e"];


  // The brake: held, it scrubs road speed toward SPEED_FLOOR at BRAKE_DECEL;
  // released, the ramp (+6 px/s) climbs straight back. It costs what the run
  // already pays for: metres tick slower, chains starve in three seconds of
  // not passing, and every point of speed must be re-earned from the ramp.
  var BRAKE_DECEL = 160;      // px/s shed per second of braking
  var SPEED_FLOOR = 180;      // px/s - below launch pace, so braking visibly pays off

  var screen = "title"; // title | playing | over
  var player, traffic, distance, speed, spawnTimer, lastTime, totalS;
  var score, closePasses, streak, streakT, bestStreak, pops;
  var chainWarned = false;  // one dry tick per chain when the bar is nearly spent
  var worldT = 0;           // run clock for the weather's own animation
  var keys = { left: false, right: false, brake: false };


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

  /* --- time of day ---------------------------------------------------------
   * The world keeps a clock, not an eternal noon. Phase is a pure function
   * of the distance travelled, exactly like the centreline, so every run
   * walks the same road through the same evening: midday, amber dusk, a long
   * stretch of true night, rose dawn, morning. k is how dark it is (0 = full
   * day, 1 = full night); warm is the dusk/dawn tint that peaks halfway
   * through each transition. */
  var DAY_LEN = 12000;        // world px per full day cycle (1800 m)

  function smooth(k) {
    k = Math.max(0, Math.min(1, k));
    return k * k * (3 - 2 * k);
  }

  function mixHex(a, b, k) {
    var na = parseInt(a.slice(1), 16);
    var nb = parseInt(b.slice(1), 16);
    var r = Math.round(((na >> 16) & 255) + (((nb >> 16) & 255) - ((na >> 16) & 255)) * k);
    var g = Math.round(((na >> 8) & 255) + (((nb >> 8) & 255) - ((na >> 8) & 255)) * k);
    var b2 = Math.round((na & 255) + ((nb & 255) - (na & 255)) * k);
    return "rgb(" + r + "," + g + "," + b2 + ")";
  }


  // Cycle windows: day .00-.09 | dusk .09-.17 | night .17-.60 |
  // dawn .60-.68 | day .68-1. On a 12000 px cycle (1800 m) the first amber
  // shows ~160 m in - no run misses the evening - full night holds from
  // ~310 m to ~1080 m, and a strong run that clears ~1100 m climbs back
  // into morning before the wheel turns again.
  function timeOfDay(s) {
    var p = (s % DAY_LEN) / DAY_LEN;
    var k = 0, warm = 0, dawn = false;
    if (p < 0.09 || p >= 0.68) {
      k = 0;
    } else if (p < 0.17) {
      k = smooth((p - 0.09) / 0.08);
      warm = Math.sin(Math.PI * (p - 0.09) / 0.08);
    } else if (p < 0.60) {
      k = 1;
    } else {
      k = 1 - smooth((p - 0.60) / 0.08);
      warm = Math.sin(Math.PI * (p - 0.60) / 0.08);
      dawn = true;
    }
    return { k: k, warm: warm, dawn: dawn };
  }


  /* --- weather --------------------------------------------------------------
   * The day clock gave the run an evening; it never gave it weather. Rain
   * fronts are a pure function of world distance, exactly like the
   * centreline and the clock, so every run walks the same fronts: a dry
   * start so the first metres stay crisp, then a front rolls in, holds a
   * good stretch of proper rain and eases away again. The 9000 px cycle is
   * deliberately out of step with the 12000 px day, so successive fronts
   * arrive under different light - dusk rain, midnight rain, morning rain -
   * instead of the same pairing forever.
   * Intensity r (0 dry .. 1 storm) drives everything you see and nothing
   * you feel: no grip, no spawn, no score line listens to it. */
  var RAIN_LEN = 9000;        // world px per weather cycle (~1350 m)

  function rainAt(s) {
    var p = (s % RAIN_LEN) / RAIN_LEN;
    if (p < 0.10) return 0;                          // dry: ~135 m of clear road
    if (p < 0.16) return smooth((p - 0.10) / 0.06);  // front rolls in ~135-215 m
    if (p < 0.46) return 1;                          // steady rain to ~620 m
    if (p < 0.52) return 1 - smooth((p - 0.46) / 0.06); // easing away to ~700 m
    return 0;
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

  /* --- the scoring loop's voice --------------------------------------------
   * Nine passes built a language nobody could hear: a tight shave pays up to
   * a hundred points and chains multiply it five-fold, yet since pass 2 the
   * only sounds in the game have been the engine drone and the crash crunch.
   * These four voices are all synthesised from the same lazily-made context,
   * all guarded so a missing or blocked AudioContext costs nothing:
   *   whooshSound - air shearing past your flank on a close pass; a band of
   *     noise sweeping down as the car goes by, panned to its side, hotter
   *     the tighter the shave;
   *   chimeSound - each link of a live chain rings two notes a step higher
   *     than the last, so you can hear which multiplier you are riding;
   *   chainWarnSound - one dry tick when the chain bar is nearly spent;
   *   chainBreakSound - a low falling blip as the multiplier dies. */
  var CHAIN_WARN_AT = 0.9;    // seconds left on the bar when the tick fires
  var noiseBuf = null;

  function getNoise() {
    if (!ac) return null;
    if (!noiseBuf) {
      try {
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) {
        noiseBuf = null;
      }
    }
    return noiseBuf;
  }

  function whooshSound(side, tight) {
    if (!ac || !master) return;
    try {
      var now = ac.currentTime;
      var buf = getNoise();
      if (!buf) return;
      var src = ac.createBufferSource();
      src.buffer = buf;
      var f = ac.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 0.9;
      f.frequency.setValueAtTime(900 + tight * 1500, now);
      f.frequency.exponentialRampToValueAtTime(180, now + 0.28);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.10 + tight * 0.22, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      src.connect(f);
      f.connect(g);
      var out = g;
      if (ac.createStereoPanner) {         // not everywhere: fall back to mono
        var pan = ac.createStereoPanner();
        pan.pan.value = Math.max(-1, Math.min(1, side)) * 0.7;
        g.connect(pan);
        out = pan;
      }
      out.connect(master);
      src.start(now, Math.random() * 0.5, 0.35);
      src.stop(now + 0.36);
    } catch (e) {
      /* stay silent rather than break */
    }
  }

  function chimeSound(step) {
    if (!ac || !master) return;
    try {
      var now = ac.currentTime;
      var base = 500 * Math.pow(1.19, Math.min(step, 5) - 2);   // x2..x5 climb
      for (var i = 0; i < 2; i++) {        // root then a fifth above
        var t = now + i * 0.07;
        var o = ac.createOscillator();
        o.type = "triangle";
        o.frequency.value = base * Math.pow(2, i * 7 / 12);
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.25);
      }
    } catch (e) {
      /* stay silent rather than break */
    }
  }

  function chainWarnSound() {
    if (!ac || !master) return;
    try {
      var now = ac.currentTime;
      var o = ac.createOscillator();
      o.type = "square";
      o.frequency.value = 1250;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      o.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + 0.08);
    } catch (e) {
      /* stay silent rather than break */
    }
  }

  function chainBreakSound() {
    if (!ac || !master) return;
    try {
      var now = ac.currentTime;
      var o = ac.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(105, now + 0.18);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      o.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + 0.26);
    } catch (e) {
      /* stay silent rather than break */
    }
  }
  function laneU(i) {
    return -HALF + LANE_W * i + LANE_W / 2;
  }

  function init() {
    player = { u: 0, vu: 0, w: 34, h: 58, steer: 300 };   // u = offset, vu = sideways velocity
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
    chainWarned = false;
    worldT = 0;         // the weather's clock restarts with every run
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
  // score and world stay frozen from the instant of contact - though the
  // weather keeps falling, so the wreck sits in the rain that killed you
  // rather than freezing mid-air.
  function overFrame(t) {
    if (screen !== "over") return;
    if (!fx) return;                     // effects swept: stop drawing
    if (fxLast == null) fxLast = t;
    var dt = Math.min((t - fxLast) / 1000, 0.05);
    fxLast = t;
    worldT += dt;
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

  function pickType() {
    var r = Math.random();
    if (r < 0.20) return "lorry";
    if (r < 0.36) return "van";
    if (r < 0.54) return "sport";
    return "sedan";
  }

  function pickPaint(type) {
    if (type === "lorry") return LORRY_PAINTS[Math.floor(Math.random() * LORRY_PAINTS.length)];
    if (type === "sport") return SPORT_PAINTS[Math.floor(Math.random() * SPORT_PAINTS.length)];
    return TRAFFIC_PAINTS[Math.floor(Math.random() * TRAFFIC_PAINTS.length)];
  }

  // Which lane a car is effectively in right now - drifters included, since
  // it reads their live u rather than their booked li.
  function effLane(u) {
    return Math.max(0, Math.min(LANES - 1, Math.round((u + HALF - LANE_W / 2) / LANE_W)));
  }

  // A spawn may not fuse onto same-lane traffic (the old code let two cars
  // materialise overlapping) and may not complete a wall: if BOTH other
  // lanes already hold a car within WALL_BLOCK of the spawn line, this lane
  // stays empty and there is always somewhere to be.
  var SAME_GAP = 190;
  var WALL_BLOCK = 150;

  function laneOk(lane, ss) {
    var others = 0;
    for (var i = 0; i < traffic.length; i++) {
      var c = traffic[i];
      if (Math.abs(c.s - ss) < SAME_GAP) {
        if (effLane(c.u) === lane) return false;   // would land on someone
        others |= 1 << effLane(c.u);
      }
    }
    var mask = 0;
    for (var l = 0; l < LANES; l++) if (l !== lane) mask |= 1 << l;
    return (others & mask) !== mask;               // both neighbours covered -> no
  }

  function pushCar(lane, ss) {
    var type = pickType();
    var spec = TYPES[type];
    var cr = CRUISE[type];
    var vy = speed * (cr[0] + Math.random() * cr[1]);
    if (vy > speed * 0.85) vy = speed * 0.85;      // nobody outruns the camera
    traffic.push({
      type: type,
      w: spec.w,
      h: spec.h,
      li: lane,
      u: laneU(lane),
      s: ss,
      vy: vy,                            // slower than you: you overtake
      prevRel: undefined,
      paint: pickPaint(type),
      blink: null,                       // { side, t } - signalling an intent
      drift: null,                       // { fromU, toU, t, dur, toLi } - mid-move
      laneT: 2 + Math.random() * 3.5,    // seconds until this driver considers one
      vyCur: vy                          // current cruise - follows the car ahead
    });
  }

  function spawn() {
    var sSpawn = totalS + 700;           // beyond the top of the screen
    var lanes = [0, 1, 2];
    for (var i = lanes.length - 1; i > 0; i--) {     // shuffled order
      var j = Math.floor(Math.random() * (i + 1));
      var t = lanes[i]; lanes[i] = lanes[j]; lanes[j] = t;
    }
    for (var a = 0; a < LANES; a++) {
      for (var b = 0; b < 3; b++) {
        var ss = sSpawn + b * 110;
        if (!laneOk(lanes[a], ss)) continue;
        pushCar(lanes[a], ss);
        spawnTimer = Math.max(0.35, 1.1 - distance * 0.0004);

        return;
      }
    }
    spawnTimer = 0.15;                   // nothing safe right now: retry soon
  }

  /* --- drivers thinking -----------------------------------------------------
   * Sedans and vans weigh up a lane change every few seconds. If they go for
   * it they indicate amber for just under a second - your warning - then ease
   * across over ~1.7s. If the door closes while they are mid-move they ease
   * back where they came from. Lorries stay in their lane all day. */
  function laneFreeFor(to, me) {
    for (var i = 0; i < traffic.length; i++) {
      var d = traffic[i];
      if (d === me) continue;
      if (effLane(d.u) === to && Math.abs(d.s - me.s) < 160) return false;
    }
    return true;
  }

  function considerMove(c) {
    c.laneT = 1.5 + Math.random() * 2;   // think again in a moment or three
    var impatient = c.vyCur < c.vy - 8;  // held up in a queue: find a way past
    if (!impatient && Math.random() < 0.25) return;   // weighed it up, stayed put
    var side = Math.random() < 0.5 ? -1 : 1;
    for (var s = 0; s < 2; s++, side = -side) {       // try either door
      var to = c.li + side;
      if (to < 0 || to >= LANES) continue;
      if (!laneFreeFor(to, c)) continue;
      c.blink = { side: side, t: 0.9 };
      break;
    }
  }

  function startDrift(c) {
    var to = c.li + c.blink.side;
    c.blink = null;
    if (to < 0 || to >= LANES || !laneFreeFor(to, c)) return;  // door closed
    c.drift = { fromU: c.u, toU: laneU(to), t: 0, dur: 1.7, toLi: to };
  }

  function stepDrift(c, dt) {
    var d = c.drift;
    d.t += dt;

    var k = Math.min(1, d.t / d.dur);
    var e = k * k * (3 - 2 * k);         // the same ease the day clock uses
    c.u = d.fromU + (d.toU - d.fromU) * e;
    if (k >= 1) {                        // arrived
      c.li = d.toLi;
      c.drift = null;
      c.laneT = 4 + Math.random() * 4;
      return;
    }
    if (d.t > 0.2 && d.dur > 1 && !laneFreeFor(d.toLi, c)) {
      // somebody took the gap while we were in it: back where you came from
      c.drift = { fromU: c.u, toU: d.fromU, t: 0, dur: 0.8, toLi: c.li };
    }
  }

  function update(dt) {
    worldT += dt;         // the rain falls on its own clock, not the ramp's
    // pace: the ramp climbs while you let it run; the brake trades speed for
    // room and everything downstream follows - drift, steering weight, the
    // engine note, the streaks - because they already listened to speed.

    if (keys.brake) {
      speed = Math.max(SPEED_FLOOR, speed - BRAKE_DECEL * dt);
    } else {
      speed += 6 * dt;                  // the ramp: ever faster
    }
    var ds = speed * dt;

    distance += ds * 0.15;              // px to metres, roughly
    totalS += ds;
    score += ds * 0.15;                 // survival pays its base rate: 1 pt/m

    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    // weighted steering: the key sets a target sideways velocity, the car
    // builds up to it and settles down from it - about 50ms to come on at
    // launch pace (a lane change begins inside two frames, but eases), and
    // ~120ms to bleed off after release so the car glides to rest instead
    // of stopping dead. Both taus stretch with the ramp: near top speed
    // committing takes about 100ms to come on, so a fast lane change must
    // be begun early and reads as a commitment, not a jerk. The ceiling is
    // unchanged: full authority is still steer (300 px/s).

    var rampK = Math.max(0, Math.min(1, (speed - 220) / 380));
    var tau = dir !== 0 ? 0.05 + 0.05 * rampK : 0.12;
    player.vu += (dir * player.steer - player.vu) * (1 - Math.exp(-dt / tau));
    if (Math.abs(player.vu) < 0.5 && dir === 0) player.vu = 0;   // settle, don't crawl
    player.u += player.vu * dt;
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

    // a live chain ticks down and dies if you stop passing close - and now
    // it says so: one dry tick as the bar runs out, a low blip when it breaks
    if (streakT > 0) {
      streakT -= dt;
      if (streakT <= 0) {
        if (streak >= 2) chainBreakSound();
        streak = 0;
        chainWarned = false;
      } else if (streak >= 2 && !chainWarned && streakT <= CHAIN_WARN_AT) {
        chainWarned = true;
        chainWarnSound();
      }
    }

    for (var i = traffic.length - 1; i >= 0; i--) {
      var c = traffic[i];

      // nobody drives through the vehicle ahead of them: closed up behind a
      // lorry, a driver eases to its pace until a lane opens - which is why
      // queues form behind the slow machines, and why you get chances to
      // sweep past both of them
      var ahead = null, gap = 1e9;
      for (var j = 0; j < traffic.length; j++) {
        var d = traffic[j];
        if (d === c) continue;
        if (effLane(d.u) === effLane(c.u) && d.s >= c.s) {
          var g = d.s - c.s;
          if (g < gap) { gap = g; ahead = d; }
        }
      }
      var want = (ahead && gap < 90) ? Math.min(c.vy, ahead.vyCur) : c.vy;
      c.vyCur += (want - c.vyCur) * Math.min(1, dt * ((ahead && gap < 90) ? 6 : 1.5));
      c.s += c.vyCur * dt;
      var rel = c.s - totalS;           // +ahead of you / -behind you

      // drivers thinking: signal, then ease across - lorries just hold on.
      // No one changes lanes close around you (rel > 220): every move is
      // announced with the whole run of road ahead still to react in.


      if (c.type !== "lorry") {
        if (c.drift) {
          stepDrift(c, dt);
        } else if (c.blink) {
          c.blink.t -= dt;
          if (c.blink.t <= 0) startDrift(c);
        } else {
          if (c.laneT <= 0 && rel > 220) considerMove(c);

          if (c.laneT <= 0 && rel > 120) considerMove(c);
        }
      }

      // Close pass: the moment a car's nose crosses your tail (rel flips
      // from ahead to behind through zero), judge how much room was left.
      // Road coordinates again - lateral clearance in u, not screen x, so
      // a bend cannot fake or hide a close shave; and the gap is measured
      // against this vehicle's own width, so shaving a lorry is judged
      // like shaving a car (for sedans this is exactly the old CAR_GAP).
      if (c.prevRel !== undefined && c.prevRel > 0 && rel <= 0) {
        var clear = Math.abs(c.u - player.u) - (c.w + player.w) / 2;
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
          // the pass speaks: air shears past the flank it happened on, and a
          // chain of two or more rings its step
          whooshSound(c.u < player.u ? -1 : 1, 1 - Math.max(0, clear) / CLOSE_MAX);
          if (streak >= 2) chimeSound(streak);
        }
      }
      c.prevRel = rel;



      // gone off the far edge behind you - or, if you brake hard under a
      // quick car, run clean away up the road - and so out of the world
      if (rel < -160 || rel > 1500) {

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
    // km/h on the same 0.15 m/px scale the metres use (x3.6 to per-hour), so
    // the pace verb - and what braking costs - is something you can read
    speedEl.textContent = String(Math.round(speed * 0.54));
  }


  // A car, drawn: soft shadow, wheels poking out, rounded body, cabin glass
  // front and rear, headlights at the nose and taillights at the tail. Same
  // footprint as ever - this changes only what you SEE. The player's red is
  // kept and given a pale racing stripe so it stays instantly yours.
  // Traffic now comes in four bodies: the seed's sedan, a taller van, a long
  // lorry with cab, box and marker lamps, and a low sport with a spoiler -
  // and any of them may be signalling amber toward the lane it is about to
  // take, front and rear, day or night.

  function drawCar(u, s, w, h, body, isPlayer, nk, type, blink) {

    var x = W / 2 + roadCenter(s) + u;
    var y = PLAYER_Y - (s - totalS);
    if (y < -h || y > H + h) return;

    // shadow: a soft dark slip offset down-right, grounding the vehicle
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#06080a";
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 5, w * 0.62, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // body roll: the car leans into its own sideways motion - up to ~6
    // degrees with the current lateral velocity, so the weight you feel in
    // the steering is something you see. The shadow stays put; the shell,
    // wheels and glass rotate together about the car's centre.
    var roll = isPlayer ?
      Math.max(-1, Math.min(1, (player.vu || 0) / 320)) * 0.105 : 0;
    if (roll !== 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(roll);
      x = 0; y = 0;                        // draw relative to the pivoted centre
    }

    function rr(px, py, pw, ph, r) {       // rounded rect path
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + pw, py, px + pw, py + ph, r);
      ctx.arcTo(px + pw, py + ph, px, py + ph, r);
      ctx.arcTo(px, py + ph, px, py, r);
      ctx.arcTo(px, py, px + pw, py, r);
      ctx.closePath();
    }

    // wheels: dark stubs just outside the body sides - one axle forward,
    // one back, and lorries carry a second pair at the tail
    ctx.fillStyle = "#101216";
    ctx.fillRect(x - w / 2 - 2.5, y - h / 2 + 7, 4, 12);
    ctx.fillRect(x + w / 2 - 1.5, y - h / 2 + 7, 4, 12);
    ctx.fillRect(x - w / 2 - 2.5, y + h / 2 - 19, 4, 12);
    ctx.fillRect(x + w / 2 - 1.5, y + h / 2 - 19, 4, 12);
    if (type === "lorry") {
      ctx.fillRect(x - w / 2 - 2.5, y + h / 2 - 31, 4, 12);
      ctx.fillRect(x + w / 2 - 1.5, y + h / 2 - 31, 4, 12);
    }

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

    if (type === "lorry") {
      // the box: a light canvas-topped trailer behind a short cab, panel
      // seams across its roof and a seam where it meets the cab
      ctx.fillStyle = "#cbd0d7";
      rr(x - w / 2 + 2, y - h / 2 + 26, w - 4, h - 32, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 2, y - h / 2 + 26);
      ctx.lineTo(x + w / 2 - 2, y - h / 2 + 26);
      ctx.stroke();
      for (var sm = 1; sm <= 3; sm++) {
        var sy2 = y - h / 2 + 26 + sm * ((h - 32) / 4);
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + 3, sy2);
        ctx.lineTo(x + w / 2 - 3, sy2);
        ctx.stroke();
      }
    } else if (type === "van") {
      // one volume: the roof runs almost the whole length behind a big
      // screen, with barn doors at the back
      var vRoofW = w - 8;
      ctx.fillStyle = shade(body, 0.78);
      rr(x - vRoofW / 2, y - h / 2 + 14, vRoofW, h - 24, 4);
      ctx.fill();
      ctx.fillStyle = "#aebfd2";
      rr(x - vRoofW / 2 + 1, y - h / 2 + 7, vRoofW - 2, 7, 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2 - 8);
      ctx.lineTo(x, y + h / 2 - 2);
      ctx.stroke();
    } else if (!isPlayer && type === "sport") {
      // low and quick: a slim canopy pushed back, twin pale stripes, and a
      // spoiler bar across the tail
      var sCabW = w - 11;
      ctx.fillStyle = shade(body, 0.72);
      rr(x - sCabW / 2, y - 8, sCabW, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#aebfd2";
      rr(x - sCabW / 2 + 1, y - 13, sCabW - 2, 5, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(240,240,235,0.5)";
      ctx.fillRect(x - 5, y - h / 2 + 3, 2, h - 14);
      ctx.fillRect(x + 3, y - h / 2 + 3, 2, h - 14);
      ctx.fillStyle = shade(body, 0.5);
      ctx.fillRect(x - w / 2 + 3, y + h / 2 - 6, w - 6, 3);
    } else {
      // cabin: darker roof between two bands of glass (the sedan, and you)
      var cabW = w - 9;
      ctx.fillStyle = shade(body, isPlayer ? 0.72 : 0.78);
      rr(x - cabW / 2, y - 11, cabW, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#aebfd2";           // windscreen, catching the sky
      rr(x - cabW / 2 + 1, y - 15, cabW - 2, 6, 2);
      ctx.fill();
      ctx.fillStyle = "#8fa1b5";           // rear window
      rr(x - cabW / 2 + 1, y + 9, cabW - 2, 5, 2);
      ctx.fill();

      if (isPlayer) {                      // the racing stripe
        ctx.fillStyle = "rgba(240,240,235,0.85)";
        ctx.fillRect(x - 2.5, y - h / 2 + 3, 5, 10);
        ctx.fillRect(x - 2.5, y + h / 2 - 13, 5, 10);
      }
    }

    // lights: pale at the nose, red at the tail (traffic runs the same way)
    ctx.fillStyle = "#ffe9b0";
    ctx.fillRect(x - w / 2 + 3, y - h / 2 + 1, 6, 3);
    ctx.fillRect(x + w / 2 - 9, y - h / 2 + 1, 6, 3);
    ctx.fillStyle = isPlayer ? "#ff5d49" : "#c93b2e";
    ctx.fillRect(x - w / 2 + 3, y + h / 2 - 4, 6, 3);
    ctx.fillRect(x + w / 2 - 9, y + h / 2 - 4, 6, 3);

    // night: the lamps carry the read. Tail-lights bloom red, head-lights
    // pool warm on the tarmac just ahead, traffic throws a faint beam of
    // its own up the road so oncoming reads before the body does, and the
    // lorry shows amber clearance lamps across the front of its box.
    if (nk > 0.03) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = nk * 0.5;
      ctx.fillStyle = "#ff3b28";
      ctx.beginPath();
      ctx.ellipse(x - w / 2 + 6, y + h / 2 - 2.5, 5.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 6, y + h / 2 - 2.5, 5.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = nk * 0.32;
      ctx.fillStyle = "#ffd98f";
      ctx.beginPath();
      ctx.ellipse(x - w / 2 + 6, y - h / 2 + 2, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 6, y - h / 2 + 2, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (type === "lorry") {
        ctx.globalAlpha = nk * 0.45;
        ctx.fillStyle = "#ffb44d";
        ctx.fillRect(x - w / 2 + 3, y - h / 2 + 27, 3, 2.5);
        ctx.fillRect(x, y - h / 2 + 27, 3, 2.5);
        ctx.fillRect(x + w / 2 - 6, y - h / 2 + 27, 3, 2.5);
      }
      if (!isPlayer) {                     // traffic's own short beam
        var bx = x, by = y - h / 2;
        var bg = ctx.createLinearGradient(0, by, 0, by - 95);
        bg.addColorStop(0, "rgba(255,224,150," + (nk * 0.13).toFixed(3) + ")");
        bg.addColorStop(1, "rgba(255,224,150,0)");
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by);
        ctx.lineTo(bx + 12, by);
        ctx.lineTo(bx + 34, by - 95);
        ctx.lineTo(bx - 34, by - 95);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    // the indicator: amber at both corners on the side it is about to take,
    // flashing while it signals - your warning that this lane is closing
    if (blink && Math.floor(blink.t * 7 % 2) === 0) {
      var ix = blink.side < 0 ? x - w / 2 + 0.5 : x + w / 2 - 4;
      ctx.fillStyle = "#ffb44d";
      ctx.fillRect(ix, y - h / 2 + 1, 3.5, 3.5);
      ctx.fillRect(ix, y + h / 2 - 5, 3.5, 3.5);
      if (nk > 0.03) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = nk * 0.55;
        ctx.fillStyle = "#ffb44d";
        ctx.beginPath();
        ctx.ellipse(ix + 1.75, y - h / 2 + 2.5, 4, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + 1.75, y + h / 2 - 3.5, 4, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    }

    if (roll !== 0) ctx.restore();         // out of the pivoted frame
  }

  // One tail-light's reflection in standing water: a red vertical smear
  // fading out behind the machine that sheds it. Pure weather dressing -
  // it moves nothing, pays nothing, hides nothing.
  function tailSmear(x, y, w, alpha, len) {
    var g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, "rgba(255,64,46," + alpha.toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,64,46,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y, w, len);
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
    var tod = timeOfDay(totalS);           // where in the day this frame sits
    var nk = tod.k;
    var rn = rainAt(totalS);               // how hard the rain is falling here
    var minS = totalS - (H - PLAYER_Y) - 30;   // just below the bottom edge
    var maxS = totalS + PLAYER_Y + 30;         // just above the top edge

    // the ground itself now belongs to the clock: mossy dark by day,
    // blue-black under night, everything between mixed across dusk/dawn
    ctx.fillStyle = mixHex("#191d18", "#0a0d13", nk);
    ctx.fillRect(0, 0, W, H);

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

    // wet tarmac: in the rain the surface darkens and goes glassy - same
    // ribbon, a bluer black, so the lamps have something to sit on
    ribbon(-HALF, minS, maxS, HALF, mixHex("#23262b", "#141920", rn * 0.6));

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
        var ln = 15 + ramp * 63 * (0.5 + hash(q * 23 + 5));
        var yQ = PLAYER_Y - (ss - totalS);
        if (yQ < -100 || yQ > H + 100) continue;
        ctx.globalAlpha = ramp * (0.20 + 0.18 * hash(q * 7 + 5));
        ctx.beginPath();
        ctx.moveTo(W / 2 + roadCenter(ss) + uu, yQ - ln);
        ctx.lineTo(W / 2 + roadCenter(ss) + uu, yQ);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // --- night falls on the world, but not on its machines -----------------
    // Everything painted so far is daylight-lit; it dims under a veil that
    // deepens away from the car (your lamps hold a pool around you). Cars,
    // their lamps and the score are drawn AFTER, so traffic stays readable at
    // midnight and the HUD never darkens.
    if (nk > 0.01 || tod.warm > 0.01) {

      var px = W / 2 + roadCenter(totalS) + player.u;   // the player's x
      if (nk > 0.01) {
        ctx.fillStyle = "rgba(9,13,28," + (nk * 0.16).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);                      // base mood everywhere
        var lamp = ctx.createRadialGradient(px, PLAYER_Y, 70, px, PLAYER_Y, 330);
        lamp.addColorStop(0, "rgba(9,13,28,0)");
        lamp.addColorStop(1, "rgba(9,13,28," + (nk * 0.38).toFixed(3) + ")");
        ctx.fillStyle = lamp;
        ctx.fillRect(0, 0, W, H);                      // deeper dark off-lamp
      }
      if (tod.warm > 0.01) {                            // amber dusk / rose dawn wash
        ctx.fillStyle = tod.dawn ?
          "rgba(255,132,120," + (tod.warm * 0.10).toFixed(3) + ")" :
          "rgba(255,148,84," + (tod.warm * 0.10).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);
      }
    }

    // --- wet air: the rain's own veil ---------------------------------------
    // A cool grey wash, deeper away from the car, so a front reads as weather
    // and not as dirt on the lens; drawn before anything with lamps, exactly
    // like the night veil, so every light still cuts through it.
    if (rn > 0.01) {
      var rx = W / 2 + roadCenter(totalS) + player.u;
      ctx.fillStyle = "rgba(146,161,180," + (rn * 0.10).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);                        // flat grey everywhere
      var mist = ctx.createRadialGradient(rx, PLAYER_Y, 60, rx, PLAYER_Y, 310);
      mist.addColorStop(0, "rgba(146,161,180,0)");
      mist.addColorStop(1, "rgba(118,136,158," + (rn * 0.16).toFixed(3) + ")");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, W, H);                        // thicker spray off-lamp
    }

    // delineator posts throw back a glint once it is dark: real reflectors,
    // and they keep both painted edges findable at midnight
    if (nk > 0.04) {
      var p2 = 150;
      ctx.globalAlpha = nk;
      ctx.fillStyle = "#eef2f8";
      for (var k2 = Math.floor(minS / p2); k2 * p2 <= maxS; k2++) {
        var spk = k2 * p2;
        var pyk = PLAYER_Y - (spk - totalS);
        var pxk = W / 2 + roadCenter(spk);
        ctx.fillRect(pxk - HALF - 18, pyk - 7, 4, 3);
        ctx.fillRect(pxk + HALF + 14, pyk - 7, 4, 3);
      }
      ctx.globalAlpha = 1;
    }

    // your headlight cone: carved into the veiled road before anything with
    // an engine is drawn, so every car sits ON the lit tarmac. Rain makes
    // the beam earn its keep: in wet air it swells brighter and its pool
    // spreads - at midnight in a front, your lamps are the whole world.
    if (nk > 0.02) {
      var nx = W / 2 + roadCenter(totalS) + player.u;
      var ny = PLAYER_Y - player.h / 2;
      var beam = ctx.createLinearGradient(0, ny, 0, ny - 340);
      beam.addColorStop(0, "rgba(255,240,198," + (nk * 0.30 * (1 + rn * 0.5)).toFixed(3) + ")");
      beam.addColorStop(1, "rgba(255,240,198,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(nx - 14, ny);
      ctx.lineTo(nx + 14, ny);
      ctx.lineTo(nx + 92, ny - 340);
      ctx.lineTo(nx - 92, ny - 340);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = nk * (0.22 + rn * 0.12);
      ctx.fillStyle = "#ffedbe";
      ctx.beginPath();
      ctx.ellipse(nx, ny - 26, 30 + rn * 8, 34 + rn * 9, 0, 0, Math.PI * 2);
      ctx.fill();                                        // hot pool right ahead
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    for (var i = 0; i < traffic.length; i++) {
      drawCar(traffic[i].u, traffic[i].s, traffic[i].w, traffic[i].h,
        traffic[i].paint || "#8a93a0", false, nk,
        traffic[i].type, traffic[i].blink);
    }
    drawCar(player.u, totalS, player.w, player.h, "#e04a3a", true, nk);

    // --- the wet road answers every lamp -------------------------------------
    // Standing water turns each tail-light into a long vertical smear on the
    // tarmac behind it - yours included - hotter the darker it is; by day
    // they are faint red ghosts of themselves. Drawn with the cars so a bend
    // carries the smear around with the machine that sheds it.
    if (rn > 0.04) {
      var refl = rn * (0.10 + nk * 0.22);
      var rLen = 24 + rn * 26;
      for (var ri = 0; ri < traffic.length; ri++) {
        var rc = traffic[ri];
        var ry = PLAYER_Y - (rc.s - totalS);
        if (ry < -60 || ry > H + 90) continue;
        tailSmear(W / 2 + roadCenter(rc.s) + rc.u,
          ry + rc.h / 2, rc.w * 0.72, refl, rLen);
      }
      tailSmear(W / 2 + roadCenter(totalS) + player.u,
        PLAYER_Y + player.h / 2, player.w * 0.72, refl, rLen);
    }

    // --- and the rain itself --------------------------------------------------
    // Slanted streaks across the whole canvas, in screen space, denser as
    // the front thickens; each drop keeps its own lane, speed and length off
    // the seeded scatter, and falls on the run clock so the wreck scene
    // keeps its weather.
    if (rn > 0.02) {
      var drops = Math.floor(rn * 110);
      ctx.strokeStyle = "#bcd0e4";
      ctx.lineWidth = 1;
      for (var di = 0; di < drops; di++) {
        var fall = 760 + hash(di * 7 + 3) * 520;         // this drop's speed
        var dy2 = ((worldT * fall + hash(di * 3 + 1) * (H + 80)) % (H + 80)) - 40;
        var dx2 = (hash(di * 13 + 5) * (W + 90)) - 45;
        var ln2 = 9 + hash(di * 17 + 7) * 9;
        ctx.globalAlpha = (0.10 + hash(di * 23 + 9) * 0.15) *
          (0.55 + nk * 0.45);                            // lamps catch rain at night
        ctx.beginPath();
        ctx.moveTo(dx2, dy2);
        ctx.lineTo(dx2 - 2.5, dy2 + ln2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

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
    // the brake: Down or S (or X) - held, it scrubs speed toward the floor
    if (ev.key === "ArrowDown" || ev.key === "s" || ev.key === "S" || ev.key === "x" || ev.key === "X") {
      keys.brake = true;
      ev.preventDefault();              // keep the page from scrolling instead
    }
    if ((ev.key === " " || ev.key === "Enter") && screen !== "playing") start();
    resumeAudio(); // any key counts as the gesture that may unlock sound
  });
  document.addEventListener("keyup", function (ev) {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = false;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = false;
    if (ev.key === "ArrowDown" || ev.key === "s" || ev.key === "S" || ev.key === "x" || ev.key === "X") keys.brake = false;
  });

  function touchDir(ev) {
    // steer by holding one side; hold BOTH sides and you brake - a thumb on
    // each edge is a natural panic grip, and it leaves steering to neither.
    var l = false, r = false;
    for (var i = 0; i < ev.touches.length; i++) {
      if (ev.touches[i].clientX < window.innerWidth / 2) l = true;
      else r = true;
    }
    if (l && r) {
      keys.left = false;
      keys.right = false;
      keys.brake = true;
    } else {
      keys.left = l;
      keys.right = r;
      keys.brake = false;
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
      return {
        screen: screen,

        score: Math.floor(score),
        dist: Math.floor(distance),                      // metres, for the log
        tod: Math.round(timeOfDay(totalS).k * 100) / 100, // 0 day .. 1 night
        wx: Math.round(rainAt(totalS) * 100) / 100,      // 0 dry .. 1 storm
        spd: Math.round(speed)                           // px/s, for pacing proofs
      };
    },

    start: start,
    reset: reset
  };




  init();
  draw();
})();

