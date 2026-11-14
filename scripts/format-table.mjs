// Writes the format table into README.md between its markers, from the built package's registry.
// `--check` fails instead when the README is out of date. Column padding is the formatter's, so
// the check compares cells, not spacing.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { formatTable } = await import(join(root, "packages/documents/dist/core/format-table.js"));
const path = join(root, "README.md");
const readme = await readFile(path, "utf8");
const markers = /(<!-- formats:start -->\n)[\s\S]*?(<!-- formats:end -->)/u;
const next = readme.replace(markers, `$1${formatTable()}\n$2`);

/** The table's rows as trimmed cells, with a separator row's dashes collapsed. */
const cells = (text) =>
  (text.match(markers)?.[0] ?? "")
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim().replace(/^-+$/u, "-"))
        .join("|"),
    )
    .join("\n");

if (process.argv.includes("--check")) {
  if (cells(next) !== cells(readme)) {
    console.error("README.md's format table is out of date: run `node scripts/format-table.mjs`.");
    process.exit(1);
  }
} else {
  await writeFile(path, next);
  execFileSync("vp", ["fmt", "README.md"], { cwd: root, stdio: "inherit" });
}
