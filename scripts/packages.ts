// The workspace's packages, from the root package.json. Public ones are those not marked private:
// they're released together, at one version.
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

export interface WorkspacePackage {
  readonly dir: string;
  readonly path: string;
  readonly name: string;
  readonly version: string;
  readonly json: Record<string, unknown>;
}

async function readPackage(dir: string): Promise<WorkspacePackage | undefined> {
  const path = join(dir, "package.json");
  const text = await readFile(path, "utf8").catch(() => undefined);
  if (text === undefined) return undefined;
  const json: Record<string, unknown> = JSON.parse(text);
  const name = typeof json.name === "string" ? json.name : dir;
  const version = typeof json.version === "string" ? json.version : "";
  return { dir, path, name, version, json };
}

export async function workspacePackages(): Promise<WorkspacePackage[]> {
  const manifest: { workspaces: { packages: string[] } } = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  const dirs: string[] = [];
  for (const pattern of manifest.workspaces.packages) {
    if (pattern.endsWith("/*")) {
      const parent = join(root, pattern.slice(0, -2));
      for (const entry of await readdir(parent, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs.push(join(parent, entry.name));
      }
    } else dirs.push(join(root, pattern));
  }
  const packages = await Promise.all(dirs.map(readPackage));
  return packages.filter((pkg) => pkg !== undefined);
}

export async function publicPackages(): Promise<WorkspacePackage[]> {
  return (await workspacePackages()).filter((pkg) => pkg.json.private !== true);
}
