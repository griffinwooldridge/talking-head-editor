#!/bin/bash
# usage: ./snap.sh r01 0.5,1.2,3.0  -> snapshots/r01/ (one PNG per run-relative time + contact sheet). Critique these.
cd "$(dirname "$0")" && ln -sf $1.html index.html && rm -rf snapshots/$1
npx --yes hyperframes@0.8.52 snapshot . --at $2 --no-end -o snapshots/$1 --describe false 2>&1 | tail -1
