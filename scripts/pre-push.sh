#!/usr/bin/env sh
# There's no CI on everyday pushes, on purpose: this hook is the gate before anything reaches
# GitHub. Releases run the same checks again.
set -eu

# Use the toolchain rust-toolchain.toml pins, even when another toolchain's bin directory comes
# before rustup's proxies on PATH. wasm-pack and cargo then both build with it.
if command -v rustup >/dev/null 2>&1; then
  rustup toolchain install >/dev/null
  PATH="$(dirname "$(rustup which cargo)"):$PATH"
  export PATH
fi

# What this push adds: everything since the branch it tracks, or for a branch that tracks none
# yet, since it left main. Comparing only the last commit would let code through unchecked
# whenever a Markdown-only commit came after it.
changed="$(git diff --name-only '@{upstream}' HEAD 2>/dev/null ||
  git diff --name-only "$(git merge-base origin/main HEAD 2>/dev/null || echo HEAD~1)" HEAD)"

if [ -n "$changed" ] && ! printf '%s\n' "$changed" | grep -qvE '\.md$'; then
  echo "Only Markdown changed, running formatting only."
  vp check
  exit 0
fi

# The type-aware lint reads the types wasm-pack generates for the Rust core, so build the core
# first. It's skipped when the output is newer than every Rust source.
node scripts/build-core-wasm.mjs
vp check
vp run build
vp run test
node scripts/format-table.mjs --check

vp run cargo:fmt
vp run cargo:clippy
vp run cargo:test
