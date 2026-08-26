/* Redline - the whetstone's one game, honed one facet per shift.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go.
 *
 * Pass 20 (depth): nineteen passes built a scoring act - shave close for up
 * to 100 pts, chain it to x5, race your own ghost - but never a WHERE.
 * closeBonus() reads only the clearance of a pass, so a shave pays exactly
 * the same at every metre of every run: my instrumented v19 drives logged
 * pass after pass whose worth never once consulted its position on the road,
 * so the smart line and the timid line earned identical money over identical
 * tarmac and there was nowhere worth driving TO. The road now has rich
 * ground: redline zones, a pure function of world distance exactly like the
 * centreline, the day clock, the rain, the waves and the structures - one
 * hazard-striped lane strip per ~630 m cycle (its place in the cycle and its
 * lane both come from the seeded scatter), fading open over 60 px at each
 * end. A close pass judged INSIDE one - at the nose-crossing instant where
 * scoring already happens - pays double, and the pop says so ("+240 x3
 * zone"); outside one, payouts are bit-for-bit what v19 paid. The strip is
 * painted on the tarmac with chevrons and gate bars so you can read it
 * coming ~350 px ahead, its edges glint after dark like the delineators so
 * the rich ground stays findable at midnight and in tunnels, and the title's
 * score row teaches it. state() grew a read-only zn field (zone intensity
 * under your wheels). Nothing about physics, traffic, spawning, collisions,
 * sound or the clock moved - only what a pass is WORTH and where.
 *

 * Pass 18 (audio): eleven passes gave the world storms, tunnels, a brake and
 * a pace that climbs - but none of it had a voice. Driving version 17 into a
 * full wx=1 front was a silent film: the downpour on screen changed nothing
 * in my ears; crossing a tunnel mouth flipped the whole scene to artificial
 * midnight without a whisper of concrete; holding the brake shed 60 px/s
 * with not one tyre sound; and the ramp's climb was carried by the engine
 * note alone. The world's own bed did not exist - only event blips over one
 * drone. Now it has one: four continuous ambience voices through the same
 * lazily-made context, all guarded silent-safe. Rain hisses as looped noise
 * through a bandpass whose gain follows rainAt() (hushed indoors, where rain
 * does not fall); wind rises with the ramp as lowpassed noise so pace is
 * audible beyond the engine's gear whine; tyres hiss while the brake is
 * held, hotter the faster you scrub and wetter the road; and a sub sawtooth
 * rumbles under tunnelAt(), the boom of concrete walls. Crash ducks your
 * wind, tyres and rumble near-instantly - the wreck lands quiet but for the
 * rain still falling on it; reset fades everything out. No physics,
 * scoring, spawning, drawing or clock code moved.
 *

 * Pass 17 (clarity): sixteen passes each bolted their teaching copy onto the
 * title screen, and by version 16 the front door of the game had failed:
 * instrumented, the how-paragraph was one 1589-character block rendering
 * 778 px tall on a 664 px phone viewport, and the Start button painted at
 * y 701-732 - below the fold AND below the overlay's own bottom edge
 * (563 px), so on a phone the game opened as an unreadable grey wall with
 * no visible way in; the screen did not even carry the game's name. This
 * pass rebuilds that screen and touches nothing else: a named title, then
 * the same teaching beats re-set as six scannable rows - steer / brake /
 * drive / traffic / score / ghost, a red label against one honest sentence,
 * sized so the whole screen fits beside Start at phone height - and the
 * overlay itself now scrolls inside its own box, so no future pass can push
 * the way in off-screen again. Every id, control and behaviour is exactly
 * what version 16 shipped: state(), start(), reset(), the drive, scoring,
 * sound and rendering are untouched lines.
 *

 * Pass 15 (challenge): fourteen passes tuned the road, its light and its
 * traffic - but never how BUSY it is. Instrumented drives of version 14 show
 * spawn cadence is a metronome: 1.1 s shrinking to a flat 0.35 s floor by
 * ~1900 m and then nothing but that, car after near-evenly-spaced car, so
 * every run grinds at the same uniform business from grid to wreck - my
 * weave run fed its chain by luck, a dense stretch never arrived as a
 * situation you could see coming, and there was nothing in the shape of a
 * run to read and react to. Now density breathes: traffic comes in waves, a
 * pure function of world distance exactly like the centreline, the day clock
 * and the rain - a ~720 m cycle opening on a lull (~115 m of easy road),
 * building a crest over ~60 m, holding it for ~155 m and easing away again,
 * deliberately out of step with the 12000 px weather-free day and the 9000 px
 * rain so crests arrive under different light and different fronts. In a
 * lull spawns space out to ~1.3x the old cadence; at a crest they crowd to
 * ~0.54x (hard floor 0.20 s) - chains feed when the road runs thick and
 * starve honestly when it thins, queues pile up behind lorries, and pass 8's
 * brake finally has a situation it was built for: surviving a crest. Which
 * cars appear, how they drive, collisions, scoring rates and physics are
 * untouched: only HOW OFTEN a car may materialise now breathes. state() grew
 * read-only wave and cars fields; title copy teaches the waves.
 *

 * Pass 14 (depth): twelve passes built a score-chaser that remembers - pass
 * 12 gave it a personal best - but a record that lives only on shelves is

 * furniture, not competition: instrumented drives of version 13 show the
 * mark is written once at contact and read once at boot, and nothing
 * between the Start click and the wreck so much as looks at it, so a
 * returning player's history changed nothing about how the next run played.
 * Now your best run comes back as a rival. Every run keeps a trace of where
 * it was - wall-clock time, world station, lateral offset, four samples a
 * second - and beating the mark saves your trace beside the score under its
 * own guarded storage key; from then on every run races it: a pale
 * translucent ghost interpolating that record against real time, driving
 * the exact line you drove at exactly the pace you drove it. Brake, and you
 * can watch it pull away. A HUD chip reads the gap in metres (green when
 * you lead, amber when it does, gold when you have outlived it); the crash
 * report names the result - beaten by, led by, or level. No mark yet, first
 * session: no ghost, and the game plays exactly as v13 did. Nothing about
 * collisions, spawning, steering physics, scoring rates, weather or sound
 * moved - the ghost collides with nothing, pays nothing, is only ever seen.
 *
 * Pass 13 (feel): eleven passes painted weather onto the road, but none of
 * them made it exist in your hands: rainAt() drove everything you could see
 * and nothing you could feel - an instrumented drive of version 12 held the
 * brake through a full storm and shed pace at the same rate it sheds on dry
 * tarmac (160.0 px/s^2 dry vs 159.3 wet, same instrument), steered with the
 * same bite and took bends with the same shove, so a wx=1 downpour played
 * exactly like the dry road wearing darker paint. Now the storm has weight:
 * standing water takes ~28% off the brake's bite (decel 160 -> ~115 px/s^2
 * at full wet, so a pull that cost ~480 ms on dry road costs ~670 ms in a
 * front), stretches how slowly the steering builds up and settles down
 * (+50% / +35% on its time constants; authority unchanged - full lock is
 * still 300 px/s, it just arrives later), and deepens the centrifugal shove
 * through a bend by 38%, so a line you would take flat out in the dry needs
 * respect under rain. Everything scales with the front's own intensity rn,
 * so it eases in with the weather instead of switching on; dry behaviour is
 * bit-for-bit what every earlier pass proved. Title copy teaches the grip.
 *

/* Redline - the whetstone's one game, honed one facet per shift.
 * A top-down highway racer: weave through slower traffic, and the longer you
 * last, the faster you go.
 *
 * Pass 12 (depth): eleven passes built a score-chaser with amnesia. Every
 * crash report I read on version 11 - my hands-off run dying untended at
 * 227 m, my blind weave at 232 m, a sighted bot's 343 m - showed bare
 * arithmetic with no comparison, and the title carried no record at all, so
 * the one-more-run loop this genre lives on had nothing to bite on: a great
 * run evaporated the moment the wreck settled. Now the game remembers you.
 * Your personal best - best-scoring run, with its metres - is stored under
 * one localStorage key, read and written through guards so blocked or broken
 * storage leaves the game exactly as playable as before, only unrecorded.
 * The record is judged at the instant of contact, where scoring already
 * freezes; the title screen shows the mark once you have one; and the crash
 * report delivers a verdict instead of raw numbers - "new personal best"
 * naming what it was, otherwise the score you have to beat. state() grew a
 * read-only best field for instrumentation. Nothing about driving, traffic,
 * spawning, drawing, sound or the clock moved.
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
  var titleBestEl = document.getElementById("title-best");
  var overBestEl = document.getElementById("over-best");



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

  /* --- wet grip -------------------------------------------------------------
   * The brake above (and the steering and the bend-drift below) were tuned on
   * dry tarmac, and for eleven passes the weather could not argue: rainAt()
   * painted the road but moved no constant, so a full storm played exactly
   * like the dry road wearing darker paint. These four fractions are how much
   * the front takes off each control at its peak intensity rn - standing
   * water stretches the brake (~28% less bite), makes the steering build and
   * settle more slowly (+50% / +35% on its time constants; full authority is
   * still 300 px/s, it just arrives later) and lets bends shove harder
   * (+38%). Every one scales with rn, so the grip eases away as the front
   * rolls in and comes back as it leaves; on a dry road each factor is 1 and
   * behaviour is exactly what every earlier pass proved. */
  var WET_BRAKE = 0.28;       // fraction of brake bite the storm takes
  var WET_STEER = 0.50;       // how much lazier steering builds up in the wet
  var WET_SETTLE = 0.35;      // ...and how much longer the car glides after release
  var WET_DRIFT = 0.38;       // extra centrifugal shove through a wet bend

  /* --- touch that steers, not switches --------------------------------------
   * Eighteen passes deepened the one act this game scores - putting the car
   * exactly there - but on glass the only steering primitives were two
   * on/off halves: hold left, hold right, lift, hope. Instrumented, parking
   * at a chosen line took burst after burst of full lock and still wandered
   * tens of pixels wide; threading a 20px gap that way is typing. Now one
   * finger names a place and steering grades itself toward it - TOUCH_FULL
   * of error is a full lock (so a thumb parked at the screen edge still
   * commits exactly like the old half-hold), short of it the ask scales
   * down, and a held thumb holds its line against a bend's shove - which
   * two switches could never do. The command rides the same weighted ease;
   * physics, authority, clamps and scoring are untouched. A second finger
   * remains the brake. */
  var TOUCH_FULL = 90;        // px of error that asks for full lock
  var screen = "title"; // title | playing | over
  var player, traffic, distance, speed, spawnTimer, lastTime, totalS;
  var score, closePasses, streak, streakT, bestStreak, pops;
  var chainWarned = false;  // one dry tick per chain when the bar is nearly spent
  var worldT = 0;           // run clock for the weather's own animation
  var keys = { left: false, right: false, brake: false };
  var touchX = null;        // where a thumb wants the car, in canvas x - or null


  /* --- crash presentation ---------------------------------------------------
   * The wreck is drawn, not just heard: particles, a shockwave ring, a flash
   * and decaying camera shake play out on the frozen scene before the report
   * slides in. Purely cosmetic - state() flips to "over" the instant you
   * hit, scoring stops, and start()/reset() sweep it all away. */
  var fx = null;            // { parts:[], ring, flash, shake } while a wreck animates
  var fxLast = null;        // timestamp for the wreck's own frame loop
  var overDelayTimer = null;


  /* --- the record ----------------------------------------------------------
   * Eleven passes built a score-chaser with amnesia: nothing anywhere kept a
   * best, so every session started from zero and a crash report could not say
   * whether your run meant anything. The personal best lives under one
   * localStorage key and is read and written through guards, so blocked or
   * broken storage costs nothing - the game plays identically, only
   * unrecorded. It is judged at the instant of contact, where scoring
   * freezes; the title shows the mark once you have one, and the report says
   * whether you beat it. */
  var BEST_KEY = "redline.best.v1";

  function loadBest() {
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (!raw) return null;
      var b = JSON.parse(raw);
      if (!b || typeof b.score !== "number" || typeof b.dist !== "number") return null;
      return { score: Math.floor(b.score), dist: Math.floor(b.dist) };
    } catch (e) {
      return null;                    // no storage, no record, no problem
    }
  }

  function saveBest(b) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(b));
    } catch (e) {                     // private mode / full quota: play unrecorded
    }
  }

  var best = loadBest();              // {score,dist} of your best-scoring run

  function refreshTitleBest() {
    if (!titleBestEl) return;
    if (best) {
      titleBestEl.textContent =
        "personal best " + best.score + " pts \u00b7 " + best.dist + " m";
      titleBestEl.style.display = "";
    } else {
      titleBestEl.style.display = "none";   // nothing to chase yet
    }
  }

  // Called at contact, before anything is shown: beat the mark and it moves,
  // with the report naming what it was; fall short and it names the target.
  function judgeRecord() {
    if (!overBestEl) return;
    var fs = Math.floor(score);
    if (!best || fs > best.score) {
      var was = best ? best.score : null;
      best = { score: fs, dist: Math.floor(distance) };
      saveBest(best);
      if (runTrace && runTrace.t.length >= 2) {
        saveGhost(runTrace);
        // the very next run already races this one - no reload needed
        ghostData = { t: runTrace.t.slice(), s: runTrace.s.slice(), u: runTrace.u.slice() };
      }
      overBestEl.textContent = 
        "new personal best" + (was !== null ? " \u00b7 was " + was : "");
    } else {
      overBestEl.textContent =
        "personal best " + best.score + " pts \u00b7 " + best.dist + " m";
    }
  }



  /* --- the ghost ------------------------------------------------------------
   * A record on a shelf is not in the game: the best was written once at
   * contact and read at boot, and no metre of driving ever consulted it.
   * Now the best-scoring run itself returns to the road. Every run keeps a
   * trace - [t, s, u] triplets, four samples a second: wall-clock time, the
   * world station, the lateral offset - and when a run beats the mark, its
   * trace is saved beside the score under its own guarded key, so the NEXT
   * run races it: interpolated against real elapsed time, the ghost drives
   * the exact line its driver drove at exactly the pace they drove it -
   * ahead of you when that run started faster, falling behind the moment
   * you lift or brake, gone for good past the station where it died. It
   * collides with nothing, pays nothing and is only ever seen; blocked or
   * broken storage leaves the game exactly as playable, just unaccompanied. */
  var GHOST_KEY = "redline.ghost.v1";
  var TRACE_STEP = 0.25;              // seconds between trace samples

  function loadGhost() {
    try {
      var raw = localStorage.getItem(GHOST_KEY);
      if (!raw) return null;
      var g = JSON.parse(raw);
      if (!g || !Array.isArray(g.t) || !Array.isArray(g.s) || !Array.isArray(g.u)) return null;
      if (g.t.length !== g.s.length || g.t.length !== g.u.length) return null;
      if (g.t.length < 2 || g.t.length > 20000) return null;
      for (var i = 0; i < g.t.length; i++) {
        if (typeof g.t[i] !== "number" || typeof g.s[i] !== "number" ||
            typeof g.u[i] !== "number") return null;
        if (!isFinite(g.t[i]) || !isFinite(g.s[i]) || !isFinite(g.u[i])) return null;
        if (i && g.t[i] <= g.t[i - 1]) return null;   // time must climb
      }
      return g;
    } catch (e) {
      return null;                    // no storage, no rival, no problem
    }
  }

  function saveGhost(trace) {
    try {
      localStorage.setItem(GHOST_KEY, JSON.stringify(trace));
    } catch (e) {                     // private mode / full quota: race nobody
    }
  }

  var ghostData = loadGhost();        // {t:[],s:[],u:[]} of your record run
  var runTrace = null;                // this run's trace while it lasts
  var traceT = 0;                     // worldT the last sample was taken at
  var gi = 0;                         // playback cursor (time only climbs)
  var ghostView = null;               // live snapshot {s,u,gapM,done}

  // Where the record run had got to by time t of ITS life: interpolate
  // station and lateral offset between the samples either side. Past its
  // last sample it is done - it died there - and you are now beyond it.
  function ghostAt(t) {
    var T = ghostData.t, n = T.length;
    if (t <= T[0]) return { s: ghostData.s[0], u: ghostData.u[0], done: false };
    if (t >= T[n - 1]) return { s: ghostData.s[n - 1], u: ghostData.u[n - 1], done: true };
    while (gi < n - 2 && T[gi + 1] <= t) gi++;
    var k = (t - T[gi]) / (T[gi + 1] - T[gi]);
    return {
      s: ghostData.s[gi] + (ghostData.s[gi + 1] - ghostData.s[gi]) * k,
      u: ghostData.u[gi] + (ghostData.u[gi + 1] - ghostData.u[gi]) * k,
      done: false
    };
  }

  function pushTrace(final) {
    if (!runTrace || Math.abs(worldT - traceT) < (final ? 0.02 : TRACE_STEP)) return;
    traceT = worldT;
    runTrace.t.push(Math.round(worldT * 100) / 100);
    runTrace.s.push(Math.round(totalS));
    runTrace.u.push(Math.round(player.u));
  }

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


  /* --- traffic waves --------------------------------------------------------
   * Fourteen passes tuned the road, its light and its traffic, but never how
   * BUSY it is: spawn cadence was a metronome - 1.1 s shrinking with distance
   * to a flat 0.35 s floor and then nothing but that, car after evenly spaced
   * car, every run grinding at the same uniform business from grid to wreck.
   * Density now breathes, on the same trick as everything else in this world:
   * a wave is a pure function of world distance, so every run walks the same
   * schedule - open on a lull (~115 m), build a crest over ~60 m, hold it
   * ~155 m, ease away, quiet again; the 4800 px cycle is deliberately out of
   * step with the 12000 px day and the 9000 px weather, so crests arrive
   * under different light and different fronts each time. spawnGap() below
   * scales the ramp's own cadence by it: ~1.30x in a lull, ~0.54x at a crest
   * (hard floor 0.20 s). Which cars appear, how they drive, collisions,
   * scoring rates and physics did not move - only HOW OFTEN one may
   * materialise. */
  var WAVE_LEN = 4800;        // world px per wave cycle (~720 m)

  function waveAt(s) {
    var p = (s % WAVE_LEN) / WAVE_LEN;
    if (p < 0.16) return 0;                          // lull: ~115 m of easy road
    if (p < 0.28) return smooth((p - 0.16) / 0.12);  // crest builds ~115-170 m
    if (p < 0.60) return 1;                          // holds to ~430 m
    if (p < 0.72) return 1 - smooth((p - 0.60) / 0.12); // eases away to ~520 m
    return 0;
  }


  /* --- structures -----------------------------------------------------------
   * Fifteen passes gave the road bends, a clock, weather, other drivers and
   * tides of traffic - but never a PLACE. Every structure on the verge has
   * been the same scatter of trees and reflector posts since pass 3, so a
   * 2000 m drive crosses nothing you could name: no bridge, no cutting, no
   * tunnel. The highway now has structures on it, by the same trick as
   * everything else in this world: tunnelAt(s) is a pure function of world
   * distance - a 7200 px (~1080 m) cycle holding two spans, a long tunnel
   * entered at ~100 m while the day is still bright and a short underpass at
   * ~720 m deep in the night, each easing open over 70 px at both mouths.
   * The cycle is deliberately out of step with the 12000 px day, the 9000 px
   * weather and the 4800 px wave, so the same structure arrives under
   * different light each lap: noon tunnels that leave you into dusk, midnight
   * ones, morning ones. Inside a span the renderer treats k like an
   * artificial night - walls close in, overhead lamps tick past, your own
   * beam earns its keep at midday - while collisions, spawning, steering,
   * scoring and sound listen to none of it. Half-kilometre marker posts
   * count off the distance between structures. */

  var TUN_LEN = 7200;         // world px per structures cycle (~1080 m)
  var TUN_SPANS = [[680, 1760], [4800, 5160]];   // [start, end] px in a cycle
  var TUN_EASE = 70;          // px over which each mouth opens and closes

  function tunnelAt(s) {
    var p = s % TUN_LEN;
    var best = 0;
    for (var i = 0; i < TUN_SPANS.length; i++) {
      var a = TUN_SPANS[i][0], b = TUN_SPANS[i][1];
      if (p <= a - TUN_EASE || p >= b + TUN_EASE) continue;
      var k;
      if (p < a) k = smooth((p - (a - TUN_EASE)) / TUN_EASE);
      else if (p <= b) k = 1;
      else k = 1 - smooth((p - b) / TUN_EASE);
      if (k > best) best = k;
    }
    return { k: best };
  }


  /* --- redline zones --------------------------------------------------------
   * Nineteen passes built a scoring act - shave close for up to 100 pts,
   * chained to x5 - but never a WHERE: closeBonus() reads only the clearance
   * of a pass, so daring paid the same at every metre of every run and there
   * was nowhere worth driving TO. The road now has rich ground. zoneAt(s) is
   * a pure function of world distance exactly like the centreline, the day
   * clock, rainAt, waveAt and tunnelAt: one ~630 m cycle holding a single

   * forest stable - fading open over ZONE_FADE px at each end. A close pass

   * three lanes carries it come from the same seeded scatter that keeps the
   * forest stable - fading open over ZONE_FADE px at each end. A close pass
   * judged INSIDE one (at the nose-crossing instant where scoring already
   * happens, k >= 0.5 under your wheels) pays double; outside one, payouts
   * are bit-for-bit what they always were. The cycle is deliberately out of
   * step with the day (12000 px), the weather (9000), the structures (7200)
   * and the waves (4800), so the same strip arrives under different light,
   * different weather and different traffic each lap. Nothing about physics,
   * traffic, spawning, collisions or sound listens to it: it only decides
   * what a pass is WORTH and where. state() grew read-only zn beside the
   * other world fields. */
  var ZONE_LEN = 4200;        // world px per zone cycle (~630 m)
  var ZONE_SPAN = 310;        // px of full-intensity strip (~46 m of paid ground)
  var ZONE_FADE = 60;         // px over which each end fades in and out

  function zoneAt(s) {
    var idx = Math.floor(s / ZONE_LEN);
    var off = 500 + hash(idx * 13 + 5) * 1700;       // where in this lap it sits
    var lane = Math.floor(hash(idx * 29 + 11) * 3);  // which lane carries it
    var p = s - idx * ZONE_LEN - off;
    var k = 0;
    if (p > -ZONE_FADE && p < ZONE_SPAN + ZONE_FADE) {
      if (p < 0) k = smooth((p + ZONE_FADE) / ZONE_FADE);
      else if (p <= ZONE_SPAN) k = 1;
      else k = 1 - smooth((p - ZONE_SPAN) / ZONE_FADE);
    }
    return { k: k, lane: lane };
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
      buildAmbience();                  // the world's beds, born with the context
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

  /* --- the world's own voice -----------------------------------------------
   * Passes 11 and 16 filled the road with weather and places; pass 13 put the
   * rain in the car's hands - but none of it ever made a sound. These four

   * continuous beds are that missing half: they do not fire on events, they
   * simply follow where you are and what you are doing, retuned a few times a
   * second from the same read-only state the renderer paints with -
   *   rain    looped noise through a bandpass, gain tracking rainAt(), hushed
   *           indoors because rain does not fall inside a tunnel span;
   *   wind    lowpassed noise whose gain and filter open with the ramp, so
   *           pace is audible past the engine's gear whine;
   *   tyres   a bandpass hiss only while the brake is held, hotter the faster
   *           you scrub and louder on standing water;
   *   rumble  a sub sawtooth gated by tunnelAt() - concrete around you.
   * Everything is built once beside the master gain and guarded so a blocked
   * context costs exactly what it always did: silence. */
  var amb = null;       // { rG, rF, wG, wF, bG, bF, tG } once built

  function buildAmbience() {
    if (!ac || !master || amb) return;
    try {
      var buf = getNoise();
      if (!buf) return;
      function bed(filterType, freq, q) {
        var src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        var f = ac.createBiquadFilter();
        f.type = filterType;
        f.frequency.value = freq;
        f.Q.value = q;
        var g = ac.createGain();
        g.gain.value = 0.0001;
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start();
        return { f: f, g: g };
      }
      amb = {
        rain: bed("bandpass", 2600, 0.4),
        wind: bed("lowpass", 320, 0.7)
      };
      // tyres get their own bed so brake hiss never waits on the rain
      amb.tyre = bed("bandpass", 900, 2.2);
      // the tunnel boom is tonal, not noise: a sub sawtooth behind a lowpass
      var o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 48;
      var tf = ac.createBiquadFilter();
      tf.type = "lowpass";
      tf.frequency.value = 110;
      var tg = ac.createGain();
      tg.gain.value = 0.0001;
      o.connect(tf);
      tf.connect(tg);
      tg.connect(master);
      o.start();
      amb.boom = { g: tg };
    } catch (e) {
      amb = null;
    }
  }

  // Retune every bed toward where the world says it should be. setTargetAtTime
  // smooths each move, so fronts roll in audibly instead of switching.
  function tuneAmbience() {
    if (!ac || !amb) return;
    try {
      var t = ac.currentTime;
      var wet = rainAt(totalS);
      var inside = tunnelAt(totalS).k;
      var rampK = Math.max(0, Math.min(1, (speed - 220) / 380));
      var windK = Math.pow(rampK, 1.2);              // quiet at launch, there by top pace
      var rain = wet * (1 - 0.85 * inside);          // hushed under concrete
      amb.rain.g.gain.setTargetAtTime(0.0001 + rain * 0.16, t, 0.35);
      amb.rain.f.frequency.setTargetAtTime(2100 + wet * 1500, t, 0.5);
      amb.wind.g.gain.setTargetAtTime(0.0001 + windK * 0.13, t, 0.25);
      amb.wind.f.frequency.setTargetAtTime(300 + rampK * 700, t, 0.25);
      var braking = keys.brake && screen === "playing" ?
        Math.min(1, speed / 320) : 0;
      amb.tyre.g.gain.setTargetAtTime(
        0.0001 + braking * (0.10 + 0.06 * wet), t,
        braking > 0 ? 0.05 : 0.12);                  // bite on, glide off
      amb.boom.g.gain.setTargetAtTime(
        0.0001 + inside * Math.min(1, speed / 260) * 0.09, t, 0.3);
    } catch (e) {
      /* keep playing silently rather than break */
    }
  }

  // Your wind, tyres and boom die with the car; pass hard=true at the crash
  // so the wreck lands in near-silence but for the rain still falling on it.
  function duckAmbience(withRain) {
    if (!ac || !amb) return;
    try {
      var t = ac.currentTime;
      var tau = withRain ? 0.3 : 0.08;
      amb.wind.g.gain.setTargetAtTime(0.0001, t, tau);
      amb.tyre.g.gain.setTargetAtTime(0.0001, t, tau);
      amb.boom.g.gain.setTargetAtTime(0.0001, t, tau);
      if (withRain) amb.rain.g.gain.setTargetAtTime(0.0001, t, 0.4);
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
    touchX = null;      // no thumb survives the grid
    pops = [];          // floating "+N xM" markers where passes happened
    runTrace = { t: [0], s: [0], u: [0] };   // this run's line, for the shelf
    traceT = 0;
    gi = 0;             // rewind the ghost to the grid
    ghostView = null;   // no race until update() places it
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
    duckAmbience(true);               // the whole world fades out with the run
    clearCrashFx();
    init();
    setScreen("title");
    refreshTitleBest();
    draw();
  }

  // The wreck: state() flips to "over" right now, but the report is held
  // back ~0.75s so the crash is something you SEE - flash, shockwave, debris
  // and a shudder - instead of an instant menu swap. start()/reset() cancel
  // the pending report so it can never pop up over a fresh run.
  function crash() {
    stopEngine(true);
    duckAmbience(false);              // your wind and tyres die; rain keeps on
    crashSound();
    pushTrace(true);                  // the trace ends where your run ended
    judgeRecord();                    // scoring froze here: judge the record now
    finalScoreEl.textContent = String(Math.floor(score));
    finalDetailEl.textContent =
      Math.floor(distance) + " m \u00b7 " + closePasses +
      (closePasses === 1 ? " close pass" : " close passes") +
      (bestStreak > 1 ? " \u00b7 best chain x" + Math.min(bestStreak, 5) : "");
    if (ghostView && ghostData) {     // and the report names the race itself
      finalDetailEl.textContent +=
        ghostView.done || ghostView.gapM > 0 ?
          " \u00b7 beat your ghost by " + Math.max(0, ghostView.gapM) + " m" :
          ghostView.gapM === 0 ?
            " \u00b7 level with your ghost" :
            " \u00b7 your ghost led by " + (-ghostView.gapM) + " m";
    }
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

  // Seconds until the next car may materialise: the ramp's own quickening
  // (1.1 s shrinking with distance to a 0.35 s floor) scaled by the wave -
  // ~1.30x that in a lull, ~0.54x at a crest, with a hard floor so a crest
  // can crowd the road without walling it (laneOk still refuses impossible
  // walls, and queued drivers still hold their lane until one opens).
  function spawnGap() {
    var base = Math.max(0.35, 1.1 - distance * 0.0004);
    return Math.max(0.20, base * (1.30 - 0.76 * waveAt(totalS)));
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
        spawnTimer = spawnGap();

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
    // wet: how hard it is raining right here (0 dry .. 1 storm) - the same
    // pure function of world distance the renderer paints with, now read by
    // the physics too: brake bite, steering build/settle and bend drift all
    // scale off it below.
    var wet = rainAt(totalS);

    if (keys.brake) {
      // standing water: less bite, so a storm pull sheds pace ~28% slower
      speed = Math.max(SPEED_FLOOR, speed - BRAKE_DECEL * (1 - WET_BRAKE * wet) * dt);
    } else {
      speed += 6 * dt;                  // the ramp: ever faster
    }
    var ds = speed * dt;

    distance += ds * 0.15;              // px to metres, roughly
    totalS += ds;
    score += ds * 0.15;                 // survival pays its base rate: 1 pt/m

    // the record run rides along: sample this run's line for the shelf, then
    // place the ghost where its trace says it stood at this same wall-clock
    // second of its own life - lift or brake now and you can watch it pull away
    pushTrace(false);
    if (ghostData) {
      var g = ghostAt(worldT);
      ghostView = {
        s: g.s,
        u: g.u,
        done: g.done,
        gapM: Math.round((totalS - g.s) * 0.15)   // metres, + = you lead
      };
    }

    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    // what the input asks for: the keys still speak in full authority one
    // way, but a thumb on the glass now speaks in places - it names where
    // the car should sit, and steering grades its effort toward that point,
    // so a lane change on touch is one short drag instead of a burst of
    // taps. The keys win whenever both speak at once.
    var target = 0;
    var engaged = false;
    if (dir !== 0) {
      target = dir * player.steer;
      engaged = true;
    } else if (touchX != null) {
      var pxs = W / 2 + roadCenter(totalS) + player.u;   // the car, on screen
      target = Math.max(-1, Math.min(1, (touchX - pxs) / TOUCH_FULL)) *
        player.steer;
      engaged = true;
    }
    // weighted steering: the key sets a target sideways velocity, the car
    // builds up to it and settles down from it - about 50ms to come on at
    // launch pace (a lane change begins inside two frames, but eases), and
    // ~120ms to bleed off after release so the car glides to rest instead
    // of stopping dead. Both taus stretch with the ramp: near top speed
    // committing takes about 100ms to come on, so a fast lane change must
    // be begun early and reads as a commitment, not a jerk. The ceiling is
    // unchanged: full authority is still steer (300 px/s). Water stretches
    // both taus further (+50% coming on, +35% settling at full wet), so in a
    // front every commitment must be begun that much earlier.

    var rampK = Math.max(0, Math.min(1, (speed - 220) / 380));
    var tau = engaged ?
      (0.05 + 0.05 * rampK) * (1 + WET_STEER * wet) :
      0.12 * (1 + WET_SETTLE * wet);
    player.vu += (target - player.vu) * (1 - Math.exp(-dt / tau));
    if (Math.abs(player.vu) < 0.5 && !engaged) player.vu = 0;   // settle, don't crawl
    player.u += player.vu * dt;
    // centrifugal drift: the car slides toward the outside of a bend in
    // proportion to how hard the road leans and how fast you take it -
    // negligible at 220 px/s, a shove you must counter-steer at top speed.
    // Wet tarmac lets the tail step out another 38% at full storm, so the
    // same bend asks for more counter-steer under rain than in the dry.
    player.u -= roadSlope(totalS) * speed * 0.85 * (1 + WET_DRIFT * wet) * dt;

    // clamp well inside the painted edge: the old 4px margin let the car ride
    // the white line outside the outermost lane's collision envelope, where
    // lane-3 traffic could never reach it (shift 1)
    var lim = HALF - player.w / 2 - 16;
    if (player.u < -lim) player.u = -lim;
    if (player.u > lim) player.u = lim;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = spawnGap();           // the wave decides how busy the road gets
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
          // rich ground: where the pass landed decides its worth - inside a
          // redline zone (k >= 0.5 at the pass point) it pays double
          var zoned = zoneAt(c.s).k >= 0.5;
          if (zoned) pts *= 2;
          score += pts;
          pops.push({
            u: c.u, s: c.s,             // where it happened, on the road
            text: "+" + pts + (mult > 1 ? " x" + mult : "") +
              (zoned ? " zone" : ""),
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

  function drawCar(u, s, w, h, body, isPlayer, nk, type, blink, fade) {
    // fade: multiplier on every alpha this car paints with - the ghost rides
    // at half strength so it reads as memory, not metal
    fade = fade === undefined ? 1 : fade;

    var x = W / 2 + roadCenter(s) + u;
    var y = PLAYER_Y - (s - totalS);
    if (y < -h || y > H + h) return;

    // shadow: a soft dark slip offset down-right, grounding the vehicle
    ctx.globalAlpha = (0.3) * fade;
    ctx.fillStyle = "#06080a";
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 5, w * 0.62, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1) * fade;

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
      ctx.globalAlpha = (nk * 0.5) * fade;
      ctx.fillStyle = "#ff3b28";
      ctx.beginPath();
      ctx.ellipse(x - w / 2 + 6, y + h / 2 - 2.5, 5.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 6, y + h / 2 - 2.5, 5.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (nk * 0.32) * fade;
      ctx.fillStyle = "#ffd98f";
      ctx.beginPath();
      ctx.ellipse(x - w / 2 + 6, y - h / 2 + 2, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 6, y - h / 2 + 2, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (type === "lorry") {
        ctx.globalAlpha = (nk * 0.45) * fade;
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
      ctx.globalAlpha = (1) * fade;
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
        ctx.globalAlpha = (nk * 0.55) * fade;
        ctx.fillStyle = "#ffb44d";
        ctx.beginPath();
        ctx.ellipse(ix + 1.75, y - h / 2 + 2.5, 4, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + 1.75, y + h / 2 - 3.5, 4, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = (1) * fade;
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
    // delineator posts hugging both edges, every 150px of road - except
    // where a structure stands: walls carry the edge through a tunnel
    var p = 150;
    for (var k = Math.floor(minS / p); k * p <= maxS; k++) {
      var sp = k * p;
      if (tunnelAt(sp).k > 0.02) continue;
      var py = PLAYER_Y - (sp - totalS);
      var px = W / 2 + roadCenter(sp);
      ctx.fillStyle = "#aab0b8";
      ctx.fillRect(px - HALF - 18, py - 7, 4, 14);
      ctx.fillRect(px + HALF + 14, py - 7, 4, 14);
    }
    // half-kilometre marker posts on the right verge: small reflective
    // pillars with the distance on a plate (500 m apart at 0.15 m/px), so
    // long runs tick off named ground between the structures
    var km = 3333;
    ctx.textAlign = "center";
    for (var g = Math.max(1, Math.floor(minS / km)); g * km <= maxS; g++) {
      var sg = g * km;
      if (tunnelAt(sg).k > 0.02) continue;
      var yg = PLAYER_Y - (sg - totalS);
      var xg = W / 2 + roadCenter(sg) + HALF + 26;
      ctx.fillStyle = "#dde2e8";
      ctx.fillRect(xg, yg - 13, 3, 13);
      ctx.fillStyle = "#23272e";
      ctx.fillRect(xg - 6, yg - 25, 15, 12);
      ctx.fillStyle = "#f4f6f9";
      ctx.font = "bold 8px monospace";
      ctx.fillText(String(Math.round((sg * 0.15) / 500)), xg + 1.5, yg - 16);
    }
    // trees on the verge: two staggered strands, one per side, with gaps -
    // suppressed where a structure stands, so the mass reads as solid
    var t = 330;
    for (var m = Math.floor((minS - 400) / t); m * t <= maxS + 400; m++) {
      if (hash(m) < 0.25) continue;               // a clearing now and then
      var sl = m * t + hash(m * 3 + 1) * 200;
      if (sl >= minS && sl <= maxS && tunnelAt(sl).k < 0.02) {
        var xl = W / 2 + roadCenter(sl) - HALF - 52 - hash(m * 7 + 2) * 60;
        var yl = PLAYER_Y - (sl - totalS);
        ctx.fillStyle = "#202b19";
        ctx.beginPath();
        ctx.arc(xl, yl, 13 + hash(m * 11 + 3) * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      var sr = m * t + 165 + hash(m * 5 + 4) * 200;
      if (sr >= minS && sr <= maxS && tunnelAt(sr).k < 0.02) {
        var xr = W / 2 + roadCenter(sr) + HALF + 52 + hash(m * 13 + 5) * 60;
        var yr = PLAYER_Y - (sr - totalS);
        ctx.fillStyle = "#1c2617";
        ctx.beginPath();
        ctx.arc(xr, yr, 12 + hash(m * 17 + 6) * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* A redline zone painted on the tarmac: a warm wash across the whole eased
   * span, up-chevrons marching with the travel direction through the paid
   * stretch, and a solid gate bar at each k=0.5 crossing - what lies between
   * the gates is exactly what pays double. Purely paint: nothing here is
   * consulted by physics, traffic or collisions. */
  function drawZones(minS, maxS) {
    var c0 = Math.floor((minS - ZONE_SPAN - 2 * ZONE_FADE) / ZONE_LEN) - 1;
    var c1 = Math.floor(maxS / ZONE_LEN) + 1;
    for (var z = c0; z <= c1; z++) {
      var info = zoneAt(z * ZONE_LEN + ZONE_LEN / 2);
      var off = 500 + hash(z * 13 + 5) * 1700;
      var f0 = z * ZONE_LEN + off;
      var f1 = f0 + ZONE_SPAN;
      if (f1 + ZONE_FADE < minS || f0 - ZONE_FADE > maxS) continue;
      var uL = laneU(info.lane);
      var hw = LANE_W / 2 - 9;

      ribbon(uL, f0 - ZONE_FADE, f1 + ZONE_FADE, hw, "rgba(255,178,74,0.08)");

      ctx.strokeStyle = "#ffc76a";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.40;
      for (var cs = Math.ceil(f0 / 42) * 42; cs < f1; cs += 42) {
        var cy = PLAYER_Y - (cs - totalS);
        if (cy < -20 || cy > H + 20) continue;
        var cx = W / 2 + roadCenter(cs) + uL;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + 7);
        ctx.lineTo(cx, cy - 5);
        ctx.lineTo(cx + 8, cy + 7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ribbon(uL, f0 - ZONE_FADE / 2 - 2, f0 - ZONE_FADE / 2 + 2, hw,
        "rgba(255,205,94,0.55)");
      ribbon(uL, f1 + ZONE_FADE / 2 - 2, f1 + ZONE_FADE / 2 + 2, hw,
        "rgba(255,205,94,0.55)");
    }
  }


  /* The structures themselves, drawn between the road and the veils: concrete
   * walls flanking both edges through each span, and a portal mass at each
   * mouth - heavy slabs from the canvas edges to the road opening. Returns
   * the mouths whose lintel (the beam across the road itself) must be drawn
   * later, over the cars: you pass UNDER it, so for a few frames it passes
   * over you. */
  function drawStructures(minS, maxS, nk) {
    var lintels = [];
    var c0 = Math.floor(minS / TUN_LEN) - 1;
    var c1 = Math.floor(maxS / TUN_LEN) + 1;
    for (var c = c0; c <= c1; c++) {
      for (var i = 0; i < TUN_SPANS.length; i++) {
        var a = c * TUN_LEN + TUN_SPANS[i][0];
        var b = c * TUN_LEN + TUN_SPANS[i][1];
        if (b < minS - 40 || a > maxS + 40) continue;

        // walls: dark concrete hugging both painted edges through the span,
        // with a paler inner face line so the opening stays findable
        ribbon(-HALF - 17, a, b, 17, mixHex("#454b54", "#181c22", nk));
        ribbon(HALF + 17, a, b, 17, mixHex("#454b54", "#181c22", nk));
        ribbon(-HALF - 2, a, b, 1.5, mixHex("#878e99", "#3a414b", nk));
        ribbon(HALF + 2, a, b, 1.5, mixHex("#878e99", "#3a414b", nk));

        // mouths: slab masses either side of the road, plus overhead lamps
        // marching down the span once there is any interior to light
        var mouths = [a, b];
        for (var mo = 0; mo < 2; mo++) {
          var sm = mouths[mo];
          var ym = PLAYER_Y - (sm - totalS);
          if (ym < -30 || ym > H + 30) continue;
          var xm = W / 2 + roadCenter(sm);
          ctx.fillStyle = mixHex("#343a42", "#12151a", nk);
          ctx.fillRect(0, ym - 14, xm - HALF - 8, 28);
          ctx.fillRect(xm + HALF + 8, ym - 14, W - xm - HALF - 8, 28);
          ctx.fillStyle = "rgba(196,203,212,0.5)";
          ctx.fillRect(xm - HALF - 8, ym + 12, 2 * HALF + 16, 2);
          lintels.push({ sp: sm });
        }
        var lampStep = 130;
        for (var ls = Math.ceil((a + 50) / lampStep) * lampStep; ls < b - 30; ls += lampStep) {
          var ys = PLAYER_Y - (ls - totalS);
          if (ys < -40 || ys > H + 40) continue;
          var xs = W / 2 + roadCenter(ls);
          var lk = tunnelAt(ls).k;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.30 * lk;
          ctx.fillStyle = "#ffd98f";
          ctx.beginPath();
          ctx.ellipse(xs, ys - 6, 44, 20, 0, 0, Math.PI * 2);
          ctx.fill();                                   // the lamp's halo
          ctx.globalAlpha = 0.10 * lk;
          ctx.beginPath();
          ctx.ellipse(xs, ys + 16, 62, 22, 0, 0, Math.PI * 2);
          ctx.fill();                                   // pool on the deck
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffe7b8";
          ctx.fillRect(xs - 7, ys - 9, 14, 4);           // the fitting itself
        }
      }
    }
    return lintels;
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

    // --- redline zones: the road's rich ground --------------------------------
    // A hazard-striped lane strip that doubles any close pass judged inside
    // it. Painted here with the rest of the road so the veils dim it exactly
    // like the tarmac it sits on; its gates come back bright after the veils
    // (with the delineator glints) so the rich ground stays findable at
    // midnight and inside a tunnel's artificial midnight alike.
    drawZones(minS, maxS);

    // --- structures on the road ---------------------------------------------
    // Walls, mouths and lamps of any tunnel or underpass the viewport is
    // crossing; drawn here so the veils below darken them with the world.
    // The lintels come back for later - they pass OVER the cars.
    var tk = tunnelAt(totalS).k;           // how enclosed your stretch is
    var lintels = drawStructures(minS, maxS, nk);

    // --- night falls on the world, but not on its machines -----------------
    // Everything painted so far is daylight-lit; it dims under a veil that
    // deepens away from the car (your lamps hold a pool around you). A tunnel
    // is an artificial midnight: dk folds the structure's own darkness into
    // the same veil, so noon outside means nothing once you are inside, and
    // the dusk wash dies out through the mouth. Cars, their lamps and the
    // score are drawn AFTER, so traffic stays readable at midnight and in
    // the long tunnel alike, and the HUD never darkens.
    var dk = Math.max(nk, tk * 0.96);
    if (dk > 0.01 || tod.warm > 0.01) {

      var px = W / 2 + roadCenter(totalS) + player.u;   // the player's x
      if (dk > 0.01) {
        ctx.fillStyle = "rgba(9,13,28," + (dk * 0.16).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);                      // base mood everywhere
        var lamp = ctx.createRadialGradient(px, PLAYER_Y, 70, px, PLAYER_Y, 330);
        lamp.addColorStop(0, "rgba(9,13,28,0)");
        lamp.addColorStop(1, "rgba(9,13,28," + (dk * 0.38).toFixed(3) + ")");
        ctx.fillStyle = lamp;
        ctx.fillRect(0, 0, W, H);                      // deeper dark off-lamp
      }
      if (tod.warm > 0.01 && tk < 0.99) {               // amber dusk / rose dawn wash,
        var wk = tod.warm * (1 - tk);                   // swallowed by the structure
        ctx.fillStyle = tod.dawn ?
          "rgba(255,132,120," + (wk * 0.10).toFixed(3) + ")" :
          "rgba(255,148,84," + (wk * 0.10).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);
      }
    }

    // --- wet air: the rain's own veil ---------------------------------------
    // A cool grey wash, deeper away from the car, so a front reads as weather
    // and not as dirt on the lens; drawn before anything with lamps, exactly
    // like the night veil, so every light still cuts through it. Under a
    // structure the drops stop - the deck is roofed - so the whole veil eases
    // out with the same enclosure factor the car feels.
    if (rn > 0.01 && tk < 0.99) {
      var rk = rn * (1 - tk);
      var rx = W / 2 + roadCenter(totalS) + player.u;
      ctx.fillStyle = "rgba(146,161,180," + (rk * 0.10).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);                        // flat grey everywhere
      var mist = ctx.createRadialGradient(rx, PLAYER_Y, 60, rx, PLAYER_Y, 310);
      mist.addColorStop(0, "rgba(146,161,180,0)");
      mist.addColorStop(1, "rgba(118,136,158," + (rk * 0.16).toFixed(3) + ")");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, W, H);                        // thicker spray off-lamp
    }

    // delineator posts throw back a glint once it is dark: real reflectors,

    // and they keep both painted edges findable at midnight - but not under
    // a structure, where the walls carry the edge instead
    if (nk > 0.04) {
      var p2 = 150;
      ctx.globalAlpha = nk;
      ctx.fillStyle = "#eef2f8";
      for (var k2 = Math.floor(minS / p2); k2 * p2 <= maxS; k2++) {
        var spk = k2 * p2;
        if (tunnelAt(spk).k > 0.02) continue;
        var pyk = PLAYER_Y - (spk - totalS);
        var pxk = W / 2 + roadCenter(spk);
        ctx.fillRect(pxk - HALF - 18, pyk - 7, 4, 3);
        ctx.fillRect(pxk + HALF + 14, pyk - 7, 4, 3);
      }
      ctx.globalAlpha = 1;
    }

    // the redline zones keep their gates findable in the dark: the same two
    // bars again, lit by whatever darkness holds - night, or the artificial
    // midnight of a tunnel - so the rich ground reads at a glance when your
    // lamps are the whole world
    if (Math.max(nk, tk * 0.96) > 0.04) {
      var zk = Math.max(nk, tk * 0.96);
      var zc0 = Math.floor((minS - ZONE_SPAN - 2 * ZONE_FADE) / ZONE_LEN) - 1;
      var zc1 = Math.floor(maxS / ZONE_LEN) + 1;
      for (var zg = zc0; zg <= zc1; zg++) {
        var zoff = 500 + hash(zg * 13 + 5) * 1700;
        var zf0 = zg * ZONE_LEN + zoff;
        var zf1 = zf0 + ZONE_SPAN;
        if (zf1 + ZONE_FADE < minS || zf0 - ZONE_FADE > maxS) continue;
        var zu = laneU(zoneAt(zf0 + ZONE_SPAN / 2).lane);
        var zh = LANE_W / 2 - 9;
        ctx.globalAlpha = zk * 0.70;
        ribbon(zu, zf0 - ZONE_FADE / 2 - 2, zf0 - ZONE_FADE / 2 + 2, zh,
          "#ffd75e");
        ribbon(zu, zf1 + ZONE_FADE / 2 - 2, zf1 + ZONE_FADE / 2 + 2, zh,
          "#ffd75e");
        ctx.globalAlpha = zk * 0.22;
        ribbon(zu - zh, zf0, zf1, 1.2, "#ffcf6e");
        ribbon(zu + zh, zf0, zf1, 1.2, "#ffcf6e");
      }
      ctx.globalAlpha = 1;
    }

    // your headlight cone: carved into the veiled road before anything with
    // an engine is drawn, so every car sits ON the lit tarmac. Rain makes
    // the beam earn its keep: in wet air it swells brighter and its pool
    // spreads - at midnight in a front, your lamps are the whole world. A
    // tunnel is the same bargain at noon: dk folds its darkness in, so your
    // beam switches itself on crossing the mouth.
    if (dk > 0.02) {
      var nx = W / 2 + roadCenter(totalS) + player.u;
      var ny = PLAYER_Y - player.h / 2;
      var beam = ctx.createLinearGradient(0, ny, 0, ny - 340);
      beam.addColorStop(0, "rgba(255,240,198," + (dk * 0.30 * (1 + rn * 0.5)).toFixed(3) + ")");
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
      ctx.globalAlpha = dk * (0.22 + rn * 0.12);
      ctx.fillStyle = "#ffedbe";
      ctx.beginPath();
      ctx.ellipse(nx, ny - 26, 30 + rn * 8, 34 + rn * 9, 0, 0, Math.PI * 2);
      ctx.fill();                                        // hot pool right ahead

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    // the ghost of your record run, riding the road at half strength and
    // drawn before anything solid so it reads as memory: it takes no room,
    // collides with nothing, pays nothing, and past the station where it
    // crashed it is simply gone. On the wreck screen it stands frozen where
    // you left it.
    // Machines are lit for the world they are in, not the one outside: the
    // calls pass dk - night and tunnel darkness alike - so at noon inside a
    // tunnel every tail still blooms red and every beam still cuts the air.
    if (ghostView && screen !== "title") {

      var gvy = PLAYER_Y - (ghostView.s - totalS);
      if (!ghostView.done && gvy > -80 && gvy < H + 80) {
        drawCar(ghostView.u, ghostView.s, player.w, player.h,
          "#dfe7f0", false, dk, "sedan", null, 0.5);
        ctx.globalAlpha = 1;
      }
    }

    for (var i = 0; i < traffic.length; i++) {
      drawCar(traffic[i].u, traffic[i].s, traffic[i].w, traffic[i].h,
        traffic[i].paint || "#8a93a0", false, dk,
        traffic[i].type, traffic[i].blink);
    }
    drawCar(player.u, totalS, player.w, player.h, "#e04a3a", true, dk);


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
    // keeps its weather. Under a structure the deck is roofed: the drops
    // ease out with the enclosure factor, so a storm does not fall indoors.
    if (rn > 0.02 && tk < 0.99) {
      var drops = Math.floor(rn * 110);
      ctx.strokeStyle = "#bcd0e4";
      ctx.lineWidth = 1;
      for (var di = 0; di < drops; di++) {
        var fall = 760 + hash(di * 7 + 3) * 520;         // this drop's speed
        var dy2 = ((worldT * fall + hash(di * 3 + 1) * (H + 80)) % (H + 80)) - 40;
        var dx2 = (hash(di * 13 + 5) * (W + 90)) - 45;
        var ln2 = 9 + hash(di * 17 + 7) * 9;
        ctx.globalAlpha = (0.10 + hash(di * 23 + 9) * 0.15) *
          (0.55 + nk * 0.45) *                           // lamps catch rain at night
          (1 - tk);                                      // none of it falls indoors
        ctx.beginPath();
        ctx.moveTo(dx2, dy2);

        ctx.lineTo(dx2 - 2.5, dy2 + ln2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // the lintels of the structures: the beam across the road itself, drawn
    // last of the world so a mouth passing over you really does pass OVER
    // you - cars, ghost and all - for the few frames it takes
    ctx.globalAlpha = 1;
    for (var li = 0; li < lintels.length; li++) {
      var sl = lintels[li].sp;
      var yl2 = PLAYER_Y - (sl - totalS);
      if (yl2 < -20 || yl2 > H + 20) continue;
      var xl2 = W / 2 + roadCenter(sl);
      ctx.fillStyle = mixHex("#343a42", "#12151a", nk);
      ctx.fillRect(xl2 - HALF - 8, yl2 - 12, 2 * HALF + 16, 24);
      ctx.fillStyle = "rgba(196,203,212,0.55)";
      ctx.fillRect(xl2 - HALF - 8, yl2 + 10, 2 * HALF + 16, 2);
      ctx.fillStyle = "#2a2f36";
      ctx.fillRect(xl2 - HALF - 8, yl2 - 12, 2 * HALF + 16, 4);
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

    // the race against yourself, in metres: green while you lead your
    // record's pace, amber while it has its thumb on you, gold once you
    // have outlived it entirely
    if (screen === "playing" && ghostView) {
      var gm = ghostView.gapM;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "right";
      if (ghostView.done) {
        ctx.fillStyle = "#ffd75e";
        ctx.fillText("past your ghost +" + gm + " m", W - 12, 72);
      } else if (gm >= 0) {
        ctx.fillStyle = "#9fd8a0";
        ctx.fillText("+" + gm + " m on your ghost", W - 12, 72);
      } else {
        ctx.fillStyle = "#ffb44d";
        ctx.fillText(gm + " m vs your ghost", W - 12, 72);
      }
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
      tuneAmbience();                 // the beds follow the world each frame
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
    // one finger steers by place: it names the canvas x the car should ease
    // toward, at whatever fraction of authority that distance asks for - so
    // fine moves are small drags and a thumb parked at an edge is still a
    // committed full lock. Two or more fingers are the brake, as ever: a
    // thumb on each side stays a natural panic grip. Lifting everything
    // releases both, and the car settles on its own ease.
    var t = ev.touches;
    if (t.length >= 2) {
      keys.left = false;
      keys.right = false;
      keys.brake = true;
      touchX = null;
      return;
    }
    keys.brake = false;
    if (t.length === 1) {
      var rect = canvas.getBoundingClientRect();
      var lx = (t[0].clientX - rect.left) * (W / rect.width);
      touchX = Math.max(8, Math.min(W - 8, lx));
    } else {
      touchX = null;
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
        spd: Math.round(speed),                          // px/s, for pacing proofs
        wave: Math.round(waveAt(totalS) * 100) / 100,    // 0 lull .. 1 crest
        cars: traffic.length,                            // on the road now (proofs)
        tn: Math.round(tunnelAt(totalS).k * 100) / 100,  // 0 open .. 1 inside
        zn: Math.round(zoneAt(totalS).k * 100) / 100,    // 0 outside .. 1 in the zone

        ghost: ghostView ?                               // the race vs your record

          { gap: ghostView.gapM, past: !!ghostView.done } : null,
        best: best ? { score: best.score, dist: best.dist } : null // the mark
      };

    },

    start: start,
    reset: reset
  };




  init();
  refreshTitleBest();
  draw();
})();

