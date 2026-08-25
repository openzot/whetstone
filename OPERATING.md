# Operating the whetstone

How this repository is wired: setup, the workflows, the layout, and what to
turn when you want it to behave differently. The factory itself — what it
hones and why the product is fixed — is in [README.md](README.md).

The model doing the work is `stealth/ox-alpha` via
[OpenRouter](https://openrouter.ai), through
[openzot/actions](https://github.com/openzot/actions).

## Run your own

1. Create a repository from this one (fork, or push a copy) - it must be
   public for free GitHub Pages, and Actions must be enabled.
2. Add one repository secret: **`OPENROUTER_API_KEY`**. Without it a shift
   idles (it says so in the run summary) rather than failing every half hour.
3. Run the `shift` workflow once from the Actions tab (or wait for the next
   half hour). The first run enables GitHub Pages for the repository; if your
   token is not allowed to, enable it once by hand: *Settings → Pages →
   Source: GitHub Actions*.

That is the whole setup. The honing log appears at
`https://<owner>.github.io/<repo>/`, with every version playable from it.

Optionally, add an **`HF_TOKEN`** secret (a Hugging Face token with write
access) and every shift also ships its conversation to a dataset - see
[The dataset](#the-dataset).

## How a shift works

```
shift  cron */30 ──▶ checkout ──▶ zot orders/hone.yaml ──▶ git commit + push ──▶ dispatch pages
                                   (openzot/actions/run)    always, to main

pages  push to site/ ──▶ scripts/check.sh ──▶ deploy site/
       (or dispatch)      shape + ledger ok?   only if valid
```

- **The order never changes; the ledger does.** `site/ledger.json` is the
  factory's memory. The order tells zot to play the latest version first,
  read every pass already made, name at least five candidate grievances
  across facets, strike anything already fixed or in the previous pass's
  facet, copy the latest version to the next numbered folder, and make the
  one improvement the game most needs in the copy. One pass, one facet, one
  entry, one new version - and every older version stays on the shelf,
  untouched and playable, so each iteration's changes are visible by playing
  (or diffing) one version against the next.
- **One shift, one commit - via a branch.** The shift never works on `main`:
  it opens `shift/<run-id>` first and pushes a snapshot of the working tree to
  it every five minutes while the model works, so a runner that dies - job
  timeout, cancellation, infrastructure - loses at most five minutes. At the
  end the branch is squash-merged onto `main` as one commit - `shift: pass <n>
  (<facet>) - <change>` when the order settled, `shift: work in progress` when
  it was cut short - and deleted; the snapshots never reach `main`'s history.
  If the merge will not land, the branch simply stays: it is the rescue. The
  next shift starts by folding any stranded `shift/*` branch back into its
  working tree, so a stranded pass is finished rather than lost. A pass only
  counts once it is in `ledger.json`, which the order says to write last, so
  an unfinished pass is invisible until a later shift finishes it.
- **Shifts do not overlap.** A concurrency group makes a due shift wait for
  the running one. A shift cut short by the step timeout is committed as is,
  and because session logs are kept in the Actions cache, the next shift
  *continues that conversation* rather than starting a new pass.
- **Every pass has the same shape.** Play, grieve, copy forward, hone one
  facet, play again, write one entry. `scripts/check.sh` holds the static
  half (versions 0..N for N ledger entries, three files each plus optional
  assets, a valid sequential ledger, no facet two passes running); `scripts/probe.sh` plays
  the latest version headless - it must load clean, keep the fixed
  `window.game` API, start, survive six seconds of hard play, and reset -
  and writes the screenshots the order requires zot to look at. A full
  probe run also records the version's `preview.png` - the mid-play shot
  committed with the version and shown on the log page, so the shelf shows
  what every version looked like. `scripts/probe.sh <n>` plays an older
  version (`--shots-only` to just look, which never writes into the
  folder), which is how a shift (or you) compares the edge before and after
  any pass.
- **Never break the blade.** The shift report is only green when the order
  settled *and* both halves of the gate passed - a shift that shipped a
  broken game is a failed shift, and the next shift's order says to repair
  first (facet: `repair`) before honing anything.
- **Publishing is not the shift's job.** `pages.yaml` deploys `site/` whenever
  anything lands on `main` under it, runs `scripts/check.sh` first, and stops
  there if it fails - so a broken tree is still committed (the history is
  honest) but the live site keeps serving the last good game.

## The dataset

The game is the product; the conversation that hones it is the more
interesting record. With an `HF_TOKEN` secret, the end of every shift runs
`scripts/ship.py`, which:

1. exports the shift's session with `zot sessions export` - the conversation
   in the chat shape training and evaluation tooling reads (`system` / `user`
   / `assistant` with `tool_calls` / `tool`), the screenshots the model was
   shown beside it, and the run's outcome and timings on top;
2. attaches the whetstone's side - the ledger entry, the game's three files as
   they stood at the end of the shift, the commit, whether both halves of the
   gate passed;
3. refuses to upload if the provider key appears anywhere in it;
4. appends it to the dataset as `trajectories/<session-id>/`.

The dataset repo is `openzot/whetstone` unless an **`HF_DATASET`** secret
names another; it is created on first upload, and its card lives in the
dataset repo itself, not here. Every shift ships, finished or not: a shift cut
short is a row, and the shift that continues it ships the whole chain under
its own id - the card says how to filter. Without `HF_TOKEN` the step says so
and does nothing.

## Layout

| Path | |
| --- | --- |
| `orders/hone.yaml` | the standing order |
| `AGENTS.md` | the pass, the facets, the rules zot reads before every shift |
| `site/index.html` | the honing log page (renders `ledger.json`; do not edit) |
| `site/ledger.json` | the honing log - append only |
| `site/versions/0/` | the seed, as cast - never touched again |
| `site/versions/<n>/` | the game after pass n: `index.html` + `game.css` + `game.js` + `preview.png` (+ optional `assets/`) |
| `scripts/check.sh` | the static gate: shape + ledger |
| `scripts/probe.sh` / `probe.js` | the dynamic gate: plays a version, screenshots it |
| `scripts/ship.py` | ships a shift's session to the dataset |
| `.github/workflows/shift.yaml` | the shift - hones the game, commits the pass |
| `.github/workflows/pages.yaml` | publishes `site/` to GitHub Pages |

## Tuning

- **Cadence**: the `cron` in the workflow. Each shift costs one zot run
  against the model you configure.
- **Model**: `provider` / `model` in the workflow; any OpenAI-compatible
  provider zot supports works, with its key as the secret.
- **Ambition**: the order's acceptance criteria. The default is tuned to one
  small proved pass per shift; loosen "one pass, one facet" and shifts get
  longer and the changes broader - and harder to attribute when one goes wrong.
- **The blade**: the seeded game in `site/versions/0/`. Swap it for any game
  that keeps the three-file shape and the `window.game` API and the factory
  hones that instead - reset `ledger.json` to `[]` and remove the other
  version folders when you do, so the shelf tells the truth.
- **The facets**: the table in `AGENTS.md` and the list in `scripts/check.sh`.
  They must agree, or no pass lands.

## Safety

zot runs with shell access in the checkout, on a GitHub-hosted runner, with
only the provider key in its environment (zot scrubs it from the agent's
shell). The job's `GITHUB_TOKEN` is scoped to this repository. The order
forbids touching the workflows, the scripts and the ledger page;
`scripts/check.sh` and the commit history are how you would notice if it did.

What ships to the dataset is the whole conversation - every tool call and its
output - from a checkout of a public repository. `scripts/ship.py` refuses the
upload if the provider key turns up in it; nothing else in the job's
environment reaches the agent's shell.
