// What the capsomer command line shares: the package root, the flags, the sizes, the file walk, the components and git.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { frontmatter } from "@drdustinedwards/site-helpers/frontmatter";
import { walkFiles } from "@dustinedwards/devkit/node";
import { inlineCss } from "./build.mjs";

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const args = process.argv.slice(2);
export const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
export const KB = 1024;
export const kb = (n) => `${(n / KB).toFixed(1)} KB`;
export const gz = (buf) => gzipSync(buf, { level: 9 }).length;
export const readJsonFile = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "site-dist",
  "test-results",
  "playwright-report",
  ".wrangler",
  ".react-router",
  "coverage",
]);

// The files under a directory with one of the extensions, skipping dot names and SKIP_DIRS; none for a missing directory.
export const walk = (dir, exts) =>
  existsSync(dir)
    ? walkFiles(dir, {
        keep: (name) => !name.startsWith(".") && exts.includes(extname(name)),
        skipDir: (name) => name.startsWith(".") || SKIP_DIRS.has(name),
      })
    : [];

export function components(root) {
  const dir = join(root, "components");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, `${d.name}.md`)))
    .map((d) => {
      const css = join(dir, d.name, `${d.name}.css`);
      const rootClass = existsSync(css)
        ? (inlineCss(css).match(/\.(cap-[\w-]+)/)?.[1] ?? null)
        : null;
      return {
        name: d.name,
        dir: join(dir, d.name),
        rootClass,
        ...frontmatter(readFileSync(join(dir, d.name, `${d.name}.md`), "utf8")).data,
      };
    });
}

export function git(argsList, cwd) {
  try {
    return execFileSync("git", argsList, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

// Raw design values in an app's CSS (tokens/token-check.mjs rawValues: every kind, with the token to use).
// Generated files and Capsomer's own token files are skipped.
