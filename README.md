# Documents

Glass's document viewer and Markdown converter for the browser. It parses any file to Markdown and shows it in your app: PDF, Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV and TSV, Markdown and text, images, video, audio and fonts. Every format it reads to Markdown it also renders, and the other way round.

Parsing is [Firecrawl's anydoc](https://github.com/firecrawl/anydoc), a fast Rust converter, compiled to WebAssembly. This repository is Glass HQ's fork of it: the format registry, the viewer, the renderers and the `@glass-hq/documents` package are Glass's, and the parser is kept in sync with upstream.

**[Try the playground](https://glass-hq.github.io/documents/)**: drop in a file to see it rendered and as Markdown. It all runs in your browser; files never leave your machine.

## Install

```bash
npm install @glass-hq/documents
```

React is an optional peer dependency, needed only for `@glass-hq/documents/react`.

## Usage

### Markdown

```js
import { toMarkdown } from "@glass-hq/documents";

const markdown = await toMarkdown(file); // a File, Blob, bytes, URL or stream
```

The format is detected from the bytes; a name or media type only decides for files without a signature, like CSV or Markdown. Conversion runs on a worker, so a large file never blocks the page. `toDocument` stops at the document model, with embedded images as bytes, and `toWorkbook` reads a spreadsheet with its styles, sizes, charts, tables, conditional formats and list validations, already resolved into each cell.

### Rendering

```js
import { createViewer } from "@glass-hq/documents";

const viewer = createViewer(element, file, { onLink: (url) => window.open(url) });
```

The viewer fills `element`, which needs a size, and scrolls inside it. It draws the document and nothing else: no toolbar. Your controls read its state and call its actions:

```js
viewer.subscribe(() => {
  const { status, page, zoom, search, sheets } = viewer.getState();
  // page: { current, total }   PDFs and presentations
  // zoom: { value, min, max }
  // search: { query, total, current, pending }
  // sheets: { names, current } spreadsheets
});

viewer.nextPage();
viewer.zoomIn();
viewer.search("revenue");
viewer.nextMatch();
viewer.selectSheet(1);
const release = viewer.renderThumbnail(3, thumbnailElement, 120); // page or slide 3, for a rail
viewer.destroy();
```

A part of the state is absent when the document has no such thing (a video has no pages), so controls for it never show. Images, video and audio given as a URL stream from it instead of being read into memory.

`@glass-hq/documents/formats` has the format registry and detection alone, with nothing that touches the DOM or loads WebAssembly, for servers and React Native.

#### React

```tsx
import { useDocumentViewer } from "@glass-hq/documents/react";

function Viewer({ file }: { file: File }) {
  const { ref, state, viewer } = useDocumentViewer(file);
  return (
    <>
      {state.page && <button onClick={() => viewer?.nextPage()}>Next</button>}
      <div ref={ref} style={{ height: 600 }} />
    </>
  );
}
```

`<DocumentView source={file} />` is the same without controls.

#### Options

- `onLink(url)`: links in a document never navigate the page. Clicks on http(s) and mailto links come here.
- `highlight(text, name)`: text and code show plain unless you pass a highlighter. It returns an element, or `{ element, destroy }` when it holds resources. Search reaches into its open shadow roots.
- `pdfWorker`: where pdf.js's worker is served from, if your bundler doesn't resolve it. The package exports it as `@glass-hq/documents/pdf.worker.min.mjs`.
- `pdfRenderer`: draw PDF pages on a worker with pdf.js's renderer, off the main thread. `true` uses the copy the package ships (`@glass-hq/documents/pdf.renderer.min.mjs`), a URL says where it's served from. Off by default; pdf.js falls back to the main thread if the worker can't start.
- `format`, `name`, `mediaType`, `maxBytes`, `signal`: as for `toMarkdown`.

#### Theming

The viewer's styles sit in a `documents` cascade layer, so any style of yours wins. These custom properties on the element cover the common cases:

| Property                                         | What it sets                             |
| ------------------------------------------------ | ---------------------------------------- |
| `--documents-background`                         | Behind the pages                         |
| `--documents-page-background`                    | The paper of PDF, Word and slide pages   |
| `--documents-page-shadow`                        | Around each page                         |
| `--documents-gap`, `--documents-padding`         | Space between and around pages           |
| `--documents-match`, `--documents-match-current` | Search highlights                        |
| `--documents-font`, `--documents-mono`           | Text in reading views, and text and code |

The document itself keeps the colors and fonts its file gives it.

#### Untrusted files

Every file is treated as hostile. Nothing in a document runs, and nothing loads from the network: macros, scripts, forms, embedded HTML and external media are never executed or fetched, links go through `onLink`, and formats without a layout engine are built node by node from the parsed model rather than from markup. Every format has a byte limit, and readers cap pages, slides and cells.

## Formats

<!-- formats:start -->

| Format                    | Extensions                                                                          | Markdown                   | Rendered as                                                       |
| ------------------------- | ----------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| PDF                       | `.pdf`                                                                              | Converted                  | Pages, through pdf.js                                             |
| Word                      | `.docx`, `.docm`, `.dotx`, `.dotm`                                                  | Converted                  | Pages, through docx-preview                                       |
| Word 97-2003              | `.doc`, `.dot`                                                                      | Converted                  | Reading view, from the document model                             |
| OpenDocument Text         | `.odt`, `.ott`                                                                      | Converted                  | Reading view, from the document model                             |
| Rich Text                 | `.rtf`                                                                              | Converted                  | Reading view, from the document model                             |
| EPUB                      | `.epub`                                                                             | Converted                  | Reading view, from the document model                             |
| PowerPoint                | `.pptx`, `.pptm`, `.ppsx`, `.ppsm`, `.potx`, `.potm`                                | Converted                  | Slides, through pptx-renderer                                     |
| PowerPoint 97-2003        | `.ppt`, `.pps`, `.pot`                                                              | Converted                  | Reading view, from the document model                             |
| OpenDocument Presentation | `.odp`, `.otp`                                                                      | Converted                  | Reading view, from the document model                             |
| Excel                     | `.xlsx`, `.xlsm`, `.xltx`, `.xltm`                                                  | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| Excel Binary              | `.xlsb`                                                                             | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| Excel 97-2003             | `.xls`, `.xlt`                                                                      | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| OpenDocument Spreadsheet  | `.ods`, `.ots`                                                                      | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| CSV                       | `.csv`                                                                              | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| TSV                       | `.tsv`, `.tab`                                                                      | Converted                  | Spreadsheet grid, with the styles, merges and charts the file has |
| Markdown                  | `.md`, `.markdown`, `.mdown`, `.mkd`                                                | As written                 | Formatted, as GitHub renders it                                   |
| Text                      | `.txt`, `.text`, `.log`                                                             | As written                 | Text, or your highlighter                                         |
| Image                     | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`, `.bmp`, `.ico`, `.heic`, `.heif` | A line describing the file | The image                                                         |
| SVG                       | `.svg`                                                                              | A line describing the file | The image                                                         |
| Video                     | `.mp4`, `.m4v`, `.mov`, `.webm`, `.ogv`, `.mkv`                                     | A line describing the file | The browser's video player                                        |
| Audio                     | `.mp3`, `.wav`, `.ogg`, `.oga`, `.opus`, `.m4a`, `.aac`, `.flac`, `.weba`           | A line describing the file | The browser's audio player                                        |
| Font                      | `.ttf`, `.otf`, `.woff`, `.woff2`                                                   | A line describing the file | A sample sheet                                                    |
| File                      | anything else                                                                       | A line describing the file | Text, or its first bytes                                          |

<!-- formats:end -->

PDF to Markdown needs text: scanned pages are reported as `needsOcr`. They still render.

## The Rust core

The parser in `src/` is upstream's anydoc crate. Each format parses into one document model and renders through one Markdown serializer. This fork adds `to_workbook`, the spreadsheet model the viewer draws, built from the same readers as the Markdown, and a `pdf` feature (on by default) so builds that never convert PDFs can leave pdf-inspector out. `wasm/` compiles it for the browser, twice: without pdf-inspector for everything but PDF to Markdown, and with it, loaded only when a PDF is converted.

Upstream publishes the crate, a CLI, Node.js and Python packages and a WebAssembly module from [firecrawl/anydoc](https://github.com/firecrawl/anydoc), with its benchmark, OCR options and API reference. `node/` and `python/` here are upstream's bindings, kept so merges stay clean; this repository doesn't release them.

## Development

You need [Bun](https://bun.sh) 1.4.4 (`.bun-version`), Node.js 26, [rustup](https://rustup.rs) and [wasm-pack](https://github.com/wasm-bindgen/wasm-pack) 0.15. rustup installs the Rust toolchain `rust-toolchain.toml` pins, with the wasm32 target.

```bash
bun install                # also installs the Git hooks
vp check                   # format, lint and type-check
vp run build               # the Rust core to WebAssembly, then the package and the playground
vp run test                # the package's tests
bun run dev:playground     # the playground at wasm/www
vp run cargo:test          # the Rust core's tests; cargo:fmt and cargo:clippy too
```

The lint type-checks against the types wasm-pack generates for the core, so build once (or run `node scripts/build-core-wasm.mjs`) before the first `vp check`. The format table above is written from the registry: run `node scripts/format-table.mjs` after changing a format.

There's no CI on everyday pushes. The `pre-push` hook runs `scripts/pre-push.sh`: every check, the build, the tests, the Rust checks and publint on the packed package.

## Releases

1. Write `changelog/<version>.md` with `date` and `title` front matter.
2. Run `bun run release <version>`. It sets the version, commits `Release documents <version>` and tags `documents@<version>`, but doesn't push.
3. Push the commit and the tag. The release workflow checks and builds everything again, publishes to npm and creates the GitHub release.

## License

[MIT](LICENSE). The parser is Firecrawl's anydoc; see [NOTICE](NOTICE).
