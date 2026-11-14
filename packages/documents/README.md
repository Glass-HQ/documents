# @glass-hq/documents

Glass's document viewer and Markdown converter for the browser, built on [Firecrawl's anydoc](https://github.com/firecrawl/anydoc) parser compiled to WebAssembly. It parses any file to Markdown and shows it in your app: PDF, Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV and TSV, Markdown and text, images, video, audio and fonts.

```bash
npm install @glass-hq/documents
```

```js
import { createViewer, toMarkdown } from "@glass-hq/documents";

const markdown = await toMarkdown(file);
const viewer = createViewer(element, file); // headless: draw your own controls from viewer.getState()
```

React: `useDocumentViewer` and `<DocumentView>` from `@glass-hq/documents/react`.

Formats, options, theming and the security model are in the [repository's README](https://github.com/Glass-HQ/documents#readme), and each release's notes are in [CHANGELOG.md](CHANGELOG.md).
