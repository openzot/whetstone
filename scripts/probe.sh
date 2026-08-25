#!/usr/bin/env bash
# Play a version of the game (the latest, unless one is named): the dynamic
# half of the gate. scripts/check.sh says the shape holds; this opens the
# version in headless Chromium and makes sure the blade is not broken - it
# loads clean, the fixed API is there, it starts, plays, survives being
# played, and resets - and takes the screenshots the model is required to
# look at. Exit 0 when the game is sound.
#
#   scripts/probe.sh                      # the latest version on the shelf
#   scripts/probe.sh <n>                  # that version
#   scripts/probe.sh [<n>] --out DIR      # screenshots somewhere else
#   scripts/probe.sh [<n>] --shots-only   # no assertions, just screenshots
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/probe.js "$@"
