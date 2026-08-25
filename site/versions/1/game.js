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
    lastTime = null;
    requestAnimationFrame(frame);
  }

  function reset() {
    init();
    setScreen("title");
    draw();
  }

  function crash() {
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
      draw();
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") keys.left = true;
    if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") keys.right = true;
    if ((ev.key === " " || ev.key === "Enter") && screen !== "playing") start();
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
  canvas.addEventListener("touchstart", function (ev) { ev.preventDefault(); touchDir(ev); }, { passive: false });
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
