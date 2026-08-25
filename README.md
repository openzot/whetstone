# zot whetstone

A software factory that hones one game to perfection.

**https://openzot.github.io/whetstone/**

The [arcade](https://github.com/openzot/arcade) ships a new game every shift;
the [machinery](https://github.com/openzot/machinery) a new machine. The
whetstone ships no new thing at all. It holds a single game - and every shift,
zot plays it, reads the log of every pass made before, finds the dullest facet,
and makes exactly one improvement: sharper feel, a fairer difficulty curve, a
sound where there was silence, a cleaner game loop. Then it proves the pass by
playing again, and writes one entry in the ledger. One blade, many passes.

## Some notes

- Nobody reviews the passes before they ship. They are model output, published
  as-is; expect the occasional pass that only polishes the flat of the blade.
- The standing order is [`orders/hone.yaml`](orders/hone.yaml) - the whole
  specification of what one pass across the stone must do. It never changes;
  what changes is the game, and [`site/ledger.json`](site/ledger.json), the
  honing log every shift reads first and appends to last.
- Every version is kept: a pass copies the latest version to the next
  numbered folder under `site/versions/` and hones the copy, so the whole
  history of the edge stays playable - version 0 is the game as it came off
  the casting bench, version n is the game after pass n, and the log page
  lines each version up with the entry that explains what changed and why,
  next to a recorded mid-play screenshot of that version (`preview.png`,
  taken by the probe), so the whole evolution is visible at a glance.
- [`AGENTS.md`](AGENTS.md) is what zot reads before every shift: the facets it
  may hone, the rule that it must play before it may touch, and the one it must
  never break - the blade stays sharp; the game is playable at the end of every
  shift, or the shift does not land.
- The gate is in two halves: [`scripts/check.sh`](scripts/check.sh) holds the
  shape (static - one folder per pass, three files each plus optional assets, a valid ledger), and
  [`scripts/probe.sh`](scripts/probe.sh) plays the latest version in a headless browser -
  it must load clean, start, run and reset - and takes the screenshots the
  model is required to look at.
- Setup, workflows, layout and tuning are in [`OPERATING.md`](OPERATING.md).
  The short version: fork this repository, add an `OPENROUTER_API_KEY` secret,
  and run the `shift` workflow once.
- Every shift's session - the whole conversation of playing, judging and
  honing - is published as a row in the
  [`openzot/whetstone`](https://huggingface.co/datasets/openzot/whetstone)
  dataset on Hugging Face, for fine-tuning, training or evaluation; how rows
  are produced is in [`OPERATING.md`](OPERATING.md#the-dataset).
- Why the product is fixed and only the facet varies - and why that is still a
  factory and not a workshop - is in [`PHILOSOPHY.md`](PHILOSOPHY.md).
