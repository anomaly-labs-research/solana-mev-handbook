#!/usr/bin/env bash
# Copy the handbook markdown from the planckwave repo into content/.
# Usage: scripts/sync-content.sh [path-to-planckwave]   (default: ../planckwave)
set -euo pipefail
# The copies in content/ carry reading-mode markers and beginner blocks that upstream lacks.
if grep -qs '<!-- \(level\|only\):' "$(dirname "$0")"/../content/*.md; then
  echo "content/ has reading-mode markers that this sync would drop; see README (Syncing from planckwave)." >&2
  read -r -p "Overwrite anyway? [y/N] " ans; [ "${ans:-n}" = y ] || exit 1
fi
src="${1:-$(dirname "$0")/../../planckwave}/docs"
dst="$(dirname "$0")/../content"
cp "$src"/mev-strategies/*.md "$dst"/
cp "$src"/state-of-solana-mev.md "$src"/solana-block-building.md "$dst"/
# The engineering doc is not part of the handbook; drop its link from the overview.
sed -i '' '/high-performance-patterns\.md/,/^  [^-]/d' "$dst"/overview.md
echo "synced $(ls "$dst" | wc -l | tr -d ' ') files into content/"
