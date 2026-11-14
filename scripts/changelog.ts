// The changelog: one changelog/<version>.md per release, with `date` and `title` front matter.
//
//   node scripts/changelog.ts check            every entry is well formed, and the version in the
//                                               public packages has one
//   node scripts/changelog.ts build            writes CHANGELOG.md, newest first, into every
//                                               public package
//   node scripts/changelog.ts notes <version>  prints an entry's notes without its front matter,
//                                               for the GitHub release
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { publicPackages } from "./packages.ts";

const root = resolve(import.meta.dirname, "..");
const folder = join(root, "changelog");

interface Entry {
  readonly version: string;
  readonly date: string;
  readonly title: string;
  readonly notes: string;
}

const semver = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/u;

/** Orders versions as semver does: a prerelease comes before its release. */
function compare(a: string, b: string): number {
  const [, ...left] = semver.exec(a) ?? [];
  const [, ...right] = semver.exec(b) ?? [];
  for (let index = 0; index < 3; index += 1) {
    const difference = Number(left[index]) - Number(right[index]);
    if (difference !== 0) return difference;
  }
  if (left[3] === right[3]) return 0;
  if (left[3] === undefined) return 1;
  if (right[3] === undefined) return -1;
  return left[3] < right[3] ? -1 : 1;
}

function parse(version: string, text: string): Entry {
  const match = /^---\n([\s\S]*?)\n---\n+([\s\S]*)$/u.exec(text);
  if (!match) throw new Error(`changelog/${version}.md has no front matter.`);
  const fields = new Map(
    (match[1] ?? "").split("\n").map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()] as const;
    }),
  );
  const date = fields.get("date") ?? "";
  const title = (fields.get("title") ?? "").replace(/^"(.*)"$/u, "$1");
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date))
    throw new Error(`changelog/${version}.md needs \`date: YYYY-MM-DD\`.`);
  if (!title) throw new Error(`changelog/${version}.md needs a \`title\`.`);
  const notes = (match[2] ?? "").trim();
  if (!notes) throw new Error(`changelog/${version}.md has no notes.`);
  return { version, date, title, notes };
}

export async function readEntries(): Promise<Entry[]> {
  const entries: Entry[] = [];
  for (const file of await readdir(folder)) {
    if (!file.endsWith(".md")) continue;
    const version = file.slice(0, -3);
    if (!semver.test(version)) throw new Error(`changelog/${file} isn't named for a version.`);
    entries.push(parse(version, await readFile(join(folder, file), "utf8")));
  }
  return entries.sort((a, b) => compare(b.version, a.version));
}

function changelog(entries: readonly Entry[]): string {
  const sections = entries.map(
    (entry) => `## ${entry.version}: ${entry.title}\n\n_${entry.date}_\n\n${entry.notes}\n`,
  );
  return `# Changelog\n\n${sections.join("\n")}`;
}

async function main() {
  const [command, version] = process.argv.slice(2);
  const entries = await readEntries();
  if (command === "check") {
    for (const pkg of await publicPackages()) {
      if (!entries.some((entry) => entry.version === pkg.version))
        throw new Error(`${pkg.name} is at ${pkg.version}, which has no changelog entry.`);
    }
  } else if (command === "build") {
    const text = changelog(entries);
    for (const pkg of await publicPackages()) {
      await writeFile(join(pkg.dir, "CHANGELOG.md"), text);
    }
  } else if (command === "notes" && version) {
    const entry = entries.find((candidate) => candidate.version === version);
    if (!entry) throw new Error(`There's no changelog/${version}.md.`);
    process.stdout.write(`${entry.notes}\n`);
  } else {
    throw new Error("Usage: node scripts/changelog.ts check | build | notes <version>");
  }
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
