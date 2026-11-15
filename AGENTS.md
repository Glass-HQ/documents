# Documents

Glass's document viewer and Markdown converter, published to npm as `@glass-hq/documents`. It's a fork of [Firecrawl's anydoc](https://github.com/firecrawl/anydoc): the Rust parser in `src/` is upstream's, compiled to WebAssembly by `wasm/`, and everything in `packages/documents` (format registry, loader, viewer, renderers, React adapter) is Glass's. `wasm/www` is the playground, deployed to GitHub Pages.

## Commands

```bash
bun install                # dependencies and Git hooks
vp check                   # format, lint and type-check (vp check --fix to format)
vp run build               # wasm builds of the core, then the package and the playground
vp run test                # the package's tests (vp test)
vp run cargo:fmt           # cargo fmt --check
vp run cargo:clippy        # clippy with -D warnings, also for the wasm32 target
vp run cargo:test          # the root crate's tests (snapshots in tests/snapshots)
bun run dev:playground     # the playground
```

Bun 1.4.4 and Node 26 for development. rustup installs the toolchain `rust-toolchain.toml` pins, with the wasm32 target, and the package build needs wasm-pack 0.15.

## Checks without CI

There's no CI on everyday work, on purpose; don't add workflows that run on pushes. The `pre-push` hook runs `scripts/pre-push.sh`, which is the gate: `vp check`, the build, the tests, the format table, the changelog, publint and Are the Types Wrong? on the packed package (`scripts/check-package.ts`), and the cargo tasks. A push of Markdown only runs `vp check`. Releases run everything again.

The type-aware lint reads the types wasm-pack generates for the core into `packages/documents/src/core/wasm*`, so `scripts/pre-push.sh` builds the core first (it's skipped when nothing in Rust changed). Do the same before a first `vp check` in a fresh clone.

## Releases and changelog

- Every release has `changelog/<version>.md`, in English, for developers using the package: front matter with `date: YYYY-MM-DD` and `title:`, then `### New`, `### Improved`, `### Fixed` or `### Breaking changes` as they apply, with code examples for API changes.
- `bun run release <version>` (`scripts/release.ts`) needs that file, writes the version into every public package (one version for all of them), commits `Release documents <version>` and tags `documents@<version>`. It never pushes; it prints the push command.
- `.github/workflows/release.yml` runs on the tag: it checks and builds everything, builds `CHANGELOG.md` into the package, publishes to npm with trusted publishing and creates the GitHub release. Run from the Actions tab, it's a dry run.
- Never push, publish or tag on GitHub without being asked.

## Before the next release

The repository moved to Vite+, Bun and tag-based releases in November 2026; nothing has been released since. The first release after that change needs these once, then delete this section:

- On npmjs.com, point `@glass-hq/documents`'s trusted publisher at `.github/workflows/release.yml` with environment `npm` (it was `publish-documents.yml`). npm refuses the publish otherwise.
- Write `changelog/<version>.md` for everything since 0.3.0: pdf.js 6.5 and the opt-in `pdfRenderer` worker, and pdf-inspector 1.26's PDF-to-Markdown changes (`<sup>`, `<sub>`, `<s>` in the output, right-to-left text order, a heading that now comes out as bold text).
- After publishing, move Glass (`Glass-HQ/Glass`) to the new version.

## Writing

Plain English in code comments, docs, changelog entries and commit messages. No em dashes in copy: use a comma, colon, parentheses or a new sentence. The lint enforces this in code (`glass/no-em-dash-copy`). Commit subjects are plain sentences, like "Move the build to Vite+".

## Repo notes

- Upstream is the `upstream` remote (firecrawl/anydoc). Bring its changes in with a merge, as earlier syncs did, and keep upstream's code as upstream writes it, so the next merge stays clean. `vp fmt` and `vp lint` skip upstream's directories (`node/`, `python/`, `bench/`, `fuzz/`, `examples/`, `skills/`, `tests/`); Rust follows `rustfmt.toml`.
- `node/` and `python/` are upstream's Node.js and Python bindings. They stay in the Cargo workspace, so clippy keeps them compiling, but this repo doesn't release them, and `node/` keeps upstream's npm lockfile outside the Bun workspace. Upstream's other npm packages (`@firecrawl/anydoc`, `@firecrawl/anydoc-wasm`) aren't released from here either.
- The core is compiled twice (`scripts/build-core-wasm.mjs`): without the `pdf` feature for everything but PDF to Markdown, and with it, loaded only to convert a PDF.
- The README's format table comes from the registry: after changing a format, run `node scripts/format-table.mjs`.
- Every file is untrusted. Nothing in a document may run or reach the network; links go through `onLink`.
- Snapshot changes in `tests/snapshots` are reviewed like code: they show what the Markdown output becomes.
