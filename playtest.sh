#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$script_dir/beyond-the-veil"

# Prefer installed tooling; fall back to the portable runtime in this workspace.
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  for node_bin in /tmp/opencode/beyond-the-veil-tooling.*/node-v24.22.1-linux-x64/bin; do
    if [[ -x "$node_bin/node" && -x "$node_bin/npm" ]]; then
      export PATH="$node_bin:$PATH"
      break
    fi
  done
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js 24 and npm 11 are required. Install them, then run this script again.' >&2
  exit 1
fi

node --input-type=module -e '
  if (Number(process.versions.node.split(".")[0]) !== 24) {
    console.error("Select Node.js 24 (see beyond-the-veil/.nvmrc), then run this script again.");
    process.exit(1);
  }
'

if [[ ! -x node_modules/.bin/vite ]]; then
  npm ci
fi

echo 'Starting the local playtest. Open the URL printed below; press Ctrl+C to stop.'
exec npm run dev -- --host 127.0.0.1 "$@"
