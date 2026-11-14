// Copies what tsc doesn't emit into packages/documents/dist: the two wasm builds of the Rust core
// and pdf.js's workers. pdf.js is resolved from the package, so this works with any linker.
import { cp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../packages/documents");
const dist = join(root, "dist");
const require = createRequire(join(root, "package.json"));

for (const folder of ["wasm", "wasm-pdf"]) {
  await cp(join(root, "src/core", folder), join(dist, "core", folder), { recursive: true });
  await rm(join(dist, "core", folder, ".gitignore"), { force: true });
}
for (const file of ["pdf.worker.min.mjs", "pdf.renderer.min.mjs"]) {
  await cp(require.resolve(`pdfjs-dist/build/${file}`), join(dist, file));
}
