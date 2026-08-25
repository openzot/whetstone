#!/usr/bin/env node
/**
 * Play a version of the whetstone's game: open it in headless Chromium and
 * make sure the blade is not broken.
 *
 *   node scripts/probe.js [version] [--out DIR] [--shots-only]
 *
 * scripts/check.sh says the shape holds; this says the game actually plays.
 * With no version named it takes the latest on the shelf (the highest
 * numbered folder in site/versions/). It loads that version's index.html
 * from disk and checks:
 *
 *   - no uncaught exceptions, console errors, failed or external requests;
 *   - the fixed API is there: window.game with name, state(), start(),
 *     reset(), and state() returns {screen, score} with a known screen;
 *   - the game starts (title -> playing), survives six seconds of being
 *     played hard (arrow keys mashed both ways), keeps a finite score, and
 *     is on a known screen at the end of it;
 *   - reset() returns it to the title, and start() works again after;
 *   - the index page (the honing log) opens on its own without errors.
 *
 * It writes screenshots next to its verdict - the title and mid-play at
 * desktop size, the title at phone size, the log - so the model can look at
 * what it is honing (that is the point: a pass begins and ends by playing).
 * A full run also records what the version looks like for the shelf: the
 * mid-play screenshot is written into the version folder as preview.png,
 * which the index page shows and scripts/check.sh requires. Exit 0 when the
 * game is sound.
 *
 * --shots-only skips every assertion, just takes the screenshots, and never
 * writes into the version folder - older versions stay untouched; the order
 * uses it to look at earlier versions and see how the edge has moved.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const v = args[i + 1];
  args.splice(i, v && !v.startsWith("--") ? 2 : 1);
  return v && !v.startsWith("--") ? v : true;
};
const outDir = flag("--out") || "/tmp/whetstone";
const shotsOnly = !!flag("--shots-only");

let version = args[0];
if (version == null) {
  const dirs = fs
    .readdirSync(path.join(ROOT, "site", "versions"))
    .filter((n) => /^\d+$/.test(n))
    .map(Number);
  if (!dirs.length) {
    console.error("probe: site/versions/ is empty; nothing to play");
    process.exit(1);
  }
  version = String(Math.max(...dirs));
}

const dir = path.join(ROOT, "site", "versions", String(version));
const pageUrl = "file://" + path.join(dir, "index.html");
const logUrl = "file://" + path.join(ROOT, "site", "index.html");
const SCREENS = ["title", "playing", "over"];

const problems = [];
const bad = (m) => problems.push(m);
const say = (m) => console.log(`probe: ${m}`);

if (!fs.existsSync(path.join(dir, "index.html"))) {
  console.error(`probe: ${dir}/index.html does not exist`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  console.error("probe: playwright is not installed (npm install -g playwright && playwright install chromium)");
  process.exit(2);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const shot = (name) => path.join(outDir, `v${version}-${name}.png`);

  const watch = (page, label) => {
    page.on("pageerror", (e) => bad(`${label}: uncaught exception: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") bad(`${label}: console error: ${m.text()}`);
    });
    page.on("requestfailed", (r) => bad(`${label}: failed request: ${r.url()}`));
    page.on("request", (r) => {
      if (!r.url().startsWith("file://")) bad(`${label}: external request: ${r.url()}`);
    });
  };

  const state = (page) =>
    page.evaluate(() => {
      try { return window.game && typeof window.game.state === "function" ? window.game.state() : null; }
      catch (e) { return { error: String(e && e.message) }; }
    });

  // --- the game, desktop ---------------------------------------------------
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  if (!shotsOnly) watch(page, `v${version}`);
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot("title-desktop") });
  say(`screenshot: ${shot("title-desktop")}`);

  const api = await page.evaluate(() => {
    const g = window.game;
    return {
      present: !!g,
      name: g && typeof g.name === "string" ? g.name : null,
      state: !!(g && typeof g.state === "function"),
      start: !!(g && typeof g.start === "function"),
      reset: !!(g && typeof g.reset === "function"),
    };
  });

  if (!shotsOnly) {
    if (!api.present) bad("window.game is missing - the fixed API is the contract every pass keeps");
    if (api.present && !api.name) bad("window.game.name is missing or not a string");
    for (const k of ["state", "start", "reset"])
      if (api.present && !api[k]) bad(`window.game.${k} is missing or not a function`);
  }

  if (api.present && api.state && api.start && api.reset) {
    let s = await state(page);
    if (!shotsOnly) {
      if (!s || s.error) bad(`state() threw or returned nothing: ${s && s.error}`);
      else if (s.screen !== "title") bad(`fresh load is on screen ${JSON.stringify(s.screen)}, expected "title"`);
    }

    // start, then play it hard for six seconds
    await page.evaluate(() => window.game.start());
    await page.waitForTimeout(300);
    s = await state(page);
    if (!shotsOnly && (!s || s.screen !== "playing"))
      bad(`start() left the game on screen ${JSON.stringify(s && s.screen)}, expected "playing"`);

    const keys = ["ArrowLeft", "ArrowRight"];
    for (let i = 0; i < 24; i++) {
      const k = keys[i % 2];
      await page.keyboard.down(k);
      await page.waitForTimeout(180);
      await page.keyboard.up(k);
      await page.waitForTimeout(70);
      if (i === 8) {
        await page.screenshot({ path: shot("playing-desktop") });
        say(`screenshot: ${shot("playing-desktop")}`);
      }
    }

    s = await state(page);
    if (!shotsOnly) {
      if (!s || s.error) bad(`state() after play threw: ${s && s.error}`);
      else {
        if (!SCREENS.includes(s.screen)) bad(`after play the screen is ${JSON.stringify(s.screen)}, not one of ${SCREENS.join("/")}`);
        if (typeof s.score !== "number" || !isFinite(s.score)) bad(`score is ${JSON.stringify(s.score)}, expected a finite number`);
      }

      // reset brings back the title; start works again after
      await page.evaluate(() => window.game.reset());
      await page.waitForTimeout(200);
      s = await state(page);
      if (!s || s.screen !== "title") bad(`reset() left the game on screen ${JSON.stringify(s && s.screen)}, expected "title"`);
      await page.evaluate(() => window.game.start());
      await page.waitForTimeout(300);
      s = await state(page);
      if (!s || s.screen !== "playing") bad(`start() after reset() left screen ${JSON.stringify(s && s.screen)}, expected "playing"`);
    }
  }
  await page.close();

  // --- the game, phone -----------------------------------------------------
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  if (!shotsOnly) watch(phone, `v${version}@390`);
  await phone.goto(pageUrl, { waitUntil: "load" });
  await phone.waitForTimeout(600);
  await phone.screenshot({ path: shot("title-phone") });
  say(`screenshot: ${shot("title-phone")}`);
  if (!shotsOnly) {
    const overflow = await phone.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) bad(`the page overflows sideways by ${overflow}px at 390px wide`);
  }
  await phone.close();

  // --- the log page --------------------------------------------------------
  const log = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  if (!shotsOnly) {
    log.on("pageerror", (e) => bad(`log: uncaught exception: ${e.message}`));
    log.on("request", (r) => {
      if (!r.url().startsWith("file://")) bad(`log: external request: ${r.url()}`);
    });
  }
  await log.goto(logUrl, { waitUntil: "load" });
  await log.waitForTimeout(400);
  await log.screenshot({ path: path.join(outDir, "log.png") });
  say(`screenshot: ${path.join(outDir, "log.png")}`);
  await log.close();

  await browser.close();

  // Record what this version looks like: the mid-play shot becomes the
  // version's committed preview. Only a full run writes it - --shots-only
  // must be safe to point at an older, immutable version.
  if (!shotsOnly) {
    const playing = shot("playing-desktop");
    const source = fs.existsSync(playing) ? playing : shot("title-desktop");
    fs.copyFileSync(source, path.join(dir, "preview.png"));
    say(`preview: ${path.join(dir, "preview.png")}`);
  }

  if (shotsOnly) {
    say(`shots only (version ${version}) - no verdict`);
    return;
  }
  if (problems.length) {
    for (const p of problems) console.error(`probe: ${p}`);
    console.error(`probe: ${problems.length} problem(s) - the blade is broken; repair before anything else`);
    process.exit(1);
  }
  say(`ok - version ${version} loads, starts, plays, and resets`);
})().catch((e) => {
  console.error(`probe: ${e.stack || e}`);
  process.exit(1);
});
