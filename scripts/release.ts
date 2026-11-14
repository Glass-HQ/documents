// Prepares a release of the repo's public packages, which share one version.
//
//   node scripts/release.ts <version>        writes the version into every public package and
//                                             the internal ranges between them, commits
//                                             "Release documents <version>" and tags
//                                             documents@<version>. Nothing is pushed.
//   node scripts/release.ts --verify <tag>   checks that a tag names the version every public
//                                             package is at, and that it has a changelog entry
//                                             (the release workflow runs this)
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { readEntries } from "./changelog.ts";
import { publicPackages } from "./packages.ts";

const NAME = "documents";
const root = resolve(import.meta.dirname, "..");
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

async function verify(tag: string) {
  const prefix = `${NAME}@`;
  if (!tag.startsWith(prefix)) throw new Error(`The tag ${tag} isn't ${prefix}<version>.`);
  const version = tag.slice(prefix.length);
  for (const pkg of await publicPackages()) {
    if (pkg.version !== version)
      throw new Error(`The tag is ${tag}, but ${pkg.name} is at ${pkg.version}.`);
  }
  if (!(await readEntries()).some((entry) => entry.version === version))
    throw new Error(`There's no changelog/${version}.md.`);
  console.log(version);
}

async function release(version: string) {
  if (!semver.test(version)) throw new Error(`${version} isn't a version, like 0.3.1.`);
  const tag = `${NAME}@${version}`;
  if (!existsSync(join(root, "changelog", `${version}.md`)))
    throw new Error(`Write changelog/${version}.md first.`);
  await readEntries();
  if (git("status", "--porcelain")) throw new Error("Commit or stash your changes first.");
  if (git("tag", "--list", tag)) throw new Error(`${tag} already exists.`);

  const packages = await publicPackages();
  const names = new Set(packages.map((pkg) => pkg.name));
  for (const pkg of packages) {
    pkg.json.version = version;
    for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      const ranges = pkg.json[field];
      if (typeof ranges !== "object" || ranges === null) continue;
      for (const name of Object.keys(ranges)) {
        if (names.has(name)) Object.assign(ranges, { [name]: version });
      }
    }
    await writeFile(pkg.path, `${JSON.stringify(pkg.json, null, 2)}\n`);
  }
  // bun.lock records each workspace package's version.
  execFileSync("bun", ["install"], { cwd: root, stdio: "inherit" });

  git("add", "bun.lock", ...packages.map((pkg) => relative(root, pkg.path)));
  git("commit", "--message", `Release ${NAME} ${version}`);
  git("tag", "--annotate", tag, "--message", `Documents ${version}`);
  console.log(`\nTagged ${tag}. Push it to publish:\n\n  git push origin HEAD ${tag}\n`);
}

const [first, second] = process.argv.slice(2);
try {
  if (first === "--verify" && second) await verify(second);
  else if (first && !first.startsWith("-")) await release(first);
  else throw new Error("Usage: node scripts/release.ts <version> | --verify <tag>");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
