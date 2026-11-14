// Packs every public package as the release does and checks the tarball: publint for the
// package.json and its files, and Are the Types Wrong? for the types each export resolves to.
// The packages are ESM-only, so CommonJS resolution isn't checked, and the pdf.js workers are
// plain scripts with no types.
import { checkPackage, createPackageFromTarballData } from "@arethetypeswrong/core";
import type { Problem } from "@arethetypeswrong/core";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { publicPackages } from "./packages.ts";

const root = resolve(import.meta.dirname, "..");
const esmOnly = (problem: Problem) =>
  !("resolutionKind" in problem) ||
  (problem.resolutionKind !== "node10" && problem.resolutionKind !== "node16-cjs");

const out = await mkdtemp(join(tmpdir(), "documents-pack-"));
let failed = false;
try {
  for (const pkg of await publicPackages()) {
    execFileSync("bun", ["pm", "pack", "--quiet", "--destination", out], { cwd: pkg.dir });
  }
  for (const file of await readdir(out)) {
    const tarball = join(out, file);
    console.log(`${file}:`);
    execFileSync(join(root, "node_modules/.bin/publint"), ["run", tarball, "--strict"], {
      stdio: "inherit",
    });
    const result = await checkPackage(
      createPackageFromTarballData(new Uint8Array(await readFile(tarball))),
      { excludeEntrypoints: [/\.mjs$/u] },
    );
    const problems = result.types ? result.problems.filter(esmOnly) : [];
    if (!result.types) {
      console.error("  Are the Types Wrong?: the package has no types.");
      failed = true;
    } else if (problems.length > 0) {
      for (const problem of problems)
        console.error(`  Are the Types Wrong?: ${JSON.stringify(problem)}`);
      failed = true;
    } else console.log("  Are the Types Wrong?: no problems.");
  }
} finally {
  await rm(out, { recursive: true, force: true });
}
if (failed) process.exit(1);
