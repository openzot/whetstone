# The whetstone

This repository is a demonstration: a software factory that holds a single
game and hones it toward perfection, one pass per shift, unattended. You are
the factory. Each run of `orders/hone.yaml` is one pass across the stone; the
workflow commits whatever you leave in the working tree and publishes `site/`
to GitHub Pages.

There is one game. You do not replace it, fork it, or start another. You make
it better - in exactly one way, but a way a player would notice - as the next
version on the shelf, and you write down what you did. Every version is kept, so anyone can play the whole
history of the edge and see what each pass changed.

## Layout

```
site/
  index.html          the honing log page (renders ledger.json; do not edit)
  ledger.json         the log - one entry per pass, append only
  versions/0/         the seed, as it came off the casting bench (never touched)
  versions/<n>/       the game after pass n - each is exactly:
    index.html          structure only - links game.css, loads game.js
    game.css            every rule the game needs
    game.js             every line of behaviour, wrapped in an IIFE
    preview.png         what this version looks like mid-play - recorded by
                        scripts/probe.sh, shown on the log page
    assets/             optional: media and data - textures, models, sounds,
                        fonts, JSON - relative-linked, never code
scripts/check.sh      holds the shape; must exit 0 before a shift ends
scripts/probe.sh      plays a version headless, takes screenshots; must exit 0
orders/hone.yaml      the standing order you are running
```

The latest version is the folder with the highest number, and there are
always exactly `N + 1` folders for `N` ledger entries: `versions/<n>` is the
game after pass `n`, and pass `n` is ledger entry `n`.

## What is on the machine

No need to go looking: the shift installs the toolbox before you start.

- `node` v22 and `python3`. There is no `package.json` here and there must not
  be one - the game is vanilla and dependency-free.
- **Playwright with headless Chromium**, plus `chromium` on `PATH`.
  `require('playwright')` resolves from any directory. `scripts/probe.sh`
  uses it to play the latest version (`scripts/probe.sh <n>` for an older
  one, `--shots-only` to just look); use it yourself to play the parts the
  probe cannot judge.
- `prettier --check index.html game.css game.js`, `htmlhint index.html`,
  `quick-lint-js game.js`, `node --check game.js` - point them straight at
  the files in the version you are honing.

Scratch files - test scripts, screenshots, notes - go in `/tmp`. Anything in
a version folder beyond the three files and `assets/` fails the check, and so
does code smuggled into `assets/`. The workflow commits whatever is left in
the working tree.

## The pass

Every shift is the same pass, in the same order:

1. **Play first.** Run `scripts/probe.sh` and look at the screenshots with
   your own eyes; then drive the latest version yourself with Playwright -
   start it, play it badly, play it well, crash, restart. You may not touch
   a line before you have played. To see how the edge has moved, look at an
   earlier version with `scripts/probe.sh <n> --shots-only`.
2. **Read the ledger.** `site/ledger.json` is every pass before yours: facet,
   grievance, change, proof. Your grievance must be a new one, and your facet
   may not be the facet of the previous pass.
3. **Copy the version forward.** With versions `0..N-1` on the shelf, copy
   `site/versions/<N-1>/` to `site/versions/<N>/`. Older versions are now
   out of bounds.
4. **Name the facet, make one change - in the copy.** One improvement,
   confined to the facet you named. Sharper is specific: "steering eases in
   over 90ms instead of snapping" is a pass; "improved the game" is not.
5. **Play again, and prove it.** The proof in your entry is what you observed
   playing the new version that you did not observe playing the old one. Run
   `scripts/check.sh` and `scripts/probe.sh`; both must exit 0. The full
   probe run also records the version's `preview.png` - the mid-play shot the
   log page shows - so make sure the last probe you run is one you would put
   on the shelf.
6. **Write the entry.** Append exactly one object to `site/ledger.json`.

## The facets

| Facet | Covers |
| --- | --- |
| `feel` | steering, responsiveness, physics, juice - how it is in the hands |
| `challenge` | difficulty curve, pacing, fairness, the shape of a run |
| `depth` | mechanics, scoring, risk and reward - reasons to play again |
| `world` | levels, places, progression, variety - new roads, weather, night runs, traffic that behaves differently, situations the player has not met |
| `audio` | synthesised sound and music (Web Audio only) |
| `looks` | art, palette, motion, effects - all drawn in code |
| `clarity` | onboarding, HUD, feedback, menus, copy |
| `reach` | touch and mobile, accessibility, performance |
| `craft` | code health - structure, bugs, dead weight |
| `repair` | only when the gate is already failing when your shift begins |

Pick the facet the game most needs, judged by playing - not the one easiest
to do. The previous pass's facet is off the table; if the last three passes
share a theme, go somewhere else entirely.

## The direction of travel

The whetstone exists to make this game *better over time* - every version a
better game than the last, in a way a returning player would notice. That is
the bar a pass has to clear: not "cleaner", not "slightly less buggy" -
*better to play*. Hunting small bugs is not the job; `repair` exists for a
failing gate, `craft` for genuinely rotten code, and neither is the default.
The default is ambition, one facet at a time:

- **more real** - motion, weight and consequence that feel believable:
  momentum, drift, braking, impacts that read as impacts (`feel`);
- **more game** - decisions worth making, risk worth taking, a reason to go
  one more run (`depth`, `challenge`);
- **more world** - the road should not be the same road forever: curves,
  weather, night, new traffic, places to get to (`world`);
- **more satisfying** - the sound, sight and feedback that make a near-miss
  grin-worthy and a crash fair (`audio`, `looks`, `clarity`).

A pass is still one focused change, still proved by playing - but sized to
matter. Ten passes from now, someone stepping through the shelf should watch
a rough toy become a game people would choose to play; a shelf of ten
imperceptible tweaks means the stone was idling. When you can name two
honest grievances, take the one whose fix a player would feel.

## The ledger entry

```json
{
  "shift": 12,
  "date": "2026-08-25",
  "facet": "feel",
  "grievance": "the car snaps sideways; a lane change at speed feels like typing",
  "change": "velocity-based steering with 90ms ease and a touch of body roll",
  "proof": "threading a two-car gap now reads as one motion; near-misses are visible instead of instant"
}
```

- `shift` is the previous entry's shift + 1 (the first pass is 1), and names
  the version folder your pass created.
- `date` is today in UTC (`date -u +%F`).
- `facet` is one word from the table above.
- `grievance` is what you observed by playing, before touching anything.
- `change` is what you did - concrete enough that a reader could find it by
  diffing your version against the one before.
- `proof` is what playing again showed. Not "it works": what you saw.

Keep the JSON valid - trailing commas break the log page.

## The rules that never bend

- **Never break the blade.** The latest version is playable start to finish
  at the end of your shift - loads from `file://`, starts, plays, ends,
  restarts without a reload - or the shift does not land. When in doubt, a
  smaller pass.
- **One pass, one facet, one entry, one new version.** Not two small ones,
  not a big one that straddles three facets.
- **Older versions are evidence.** Never edit, delete or renumber a folder
  under `site/versions/` other than the one your shift creates. The shelf is
  how anyone can see, pass by pass, what changed - a rewritten history proves
  nothing.
- **Do not undo a proved pass.** What an earlier entry proved, your version
  keeps, unless your entry says in its grievance why the old proof no longer
  holds.
- **The fixed API stays.** Every version's `game.js` exposes `window.game`
  with `name`, `state()` returning at least
  `{screen: "title"|"playing"|"over", score}`, `start()` and `reset()`. The
  probe drives the game through it; every pass leaves it true.
- **The shape stays.** Three files per version, its recorded `preview.png`
  (the probe writes it; never fake it by hand), plus an optional `assets/`
  folder, no inline `<style>` or `<script>`, classic script in an IIFE (no
  modules), no external requests of any kind, a relative link back to the log
  (`../../`). Art and sound are drawn in code, synthesised, or shipped as
  files you made in `assets/` - textures, models, audio, fonts, data - always
  relative-linked, never fetched from the network. Code lives only in the
  three files; a library cannot hide in `assets/`. The three files stay under
  about 200 KB and `assets/` under about 3 MB per version. The ceiling is
  part of the stone: a whetstone sharpens by taking material away, and a pass
  that must add may first have to tighten. (Unchanged assets copied from
  version to version cost nothing in git - identical files are stored once.)
- **Do not touch** `site/index.html`, `scripts/`, `orders/`, or the
  workflows. Do not git commit, push or tag - the workflow commits the shift.
