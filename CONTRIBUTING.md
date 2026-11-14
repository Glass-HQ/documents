# Contributing

Contributions to Documents are welcome. Keep changes focused, explain the reason for them, and give a reviewer enough context to check the result.

## Before opening an issue

- Search the existing issues and pull requests first.
- Include the version or commit, your browser or runtime, and a small reproduction. A file that shows the problem helps most, if you're free to share it.
- Don't include credentials, private documents or other sensitive data.

Report security problems privately, as [SECURITY.md](SECURITY.md) describes, never in a public issue.

Problems in how a format converts to Markdown often come from the parser, which is [Firecrawl's anydoc](https://github.com/firecrawl/anydoc). Report them here anyway; we'll take them upstream when they belong there.

## Setup

- [Bun](https://bun.sh) 1.4.4, the version in `.bun-version`
- Node.js 26
- [rustup](https://rustup.rs), which installs the Rust toolchain `rust-toolchain.toml` pins, with the wasm32 target
- [wasm-pack](https://github.com/wasm-bindgen/wasm-pack) 0.15

```sh
bun install
vp run build
```

## Checks

There's no CI on pushes. Before you open a pull request, run the same checks the `pre-push` hook runs:

```sh
sh scripts/pre-push.sh
```

It formats, lints and type-checks (`vp check`), builds, runs the package's tests and the Rust checks, and lints the packed package. Add tests where they protect the change, and update the README when behavior or the public API changes. A change to how a format converts shows up in `tests/snapshots`: review those diffs like code.

## Releases

Maintainers release by writing `changelog/<version>.md` and running `bun run release <version>`, then pushing the commit and its `documents@<version>` tag. The release workflow publishes the package. If your change affects people using the package, describe it in the pull request so it can go into the next changelog entry.
