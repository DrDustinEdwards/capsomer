#!/usr/bin/env node
// Which browser tests a pull request runs (ci.yml). Prints, and appends to $GITHUB_OUTPUT:
//   mode=full   run every spec (something shared changed, or a component's CSS reaches past its own classes)
//   mode=some   run `specs` (space-separated paths for `playwright test`) with CAPSOMER_SWEEP=`sweep`
//               (the components test/sweep.spec.ts covers)
//   mode=none   no browser test reads anything that changed
// The changed files are `git diff --name-only <base> HEAD`; the base defaults to HEAD^1, which on
// a pull_request event is the base branch side of the merge commit Actions checks out
// (checkout with fetch-depth: 2). Given paths as arguments, it uses those instead:
//   node scripts/ci-specs.mjs components/button/button.css
// A component runs its own specs and sweep entries and those of every component that writes one
// of its classes or imports its files, and of whatever imports those in turn.
// Pushes to main run everything. A change to package.json's version alone (the release PR) runs none: the release PR
// carries main's code, which main's own run already tested.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Paths no browser test reads. Anything not named here or under components/<name>/ runs everything.
const UNTESTED = [
  /^(docs|design|no-bloat|worker|\.claude|\.changeset)\//,
  /^scripts\/.*\.py$/,
  // The root Markdown files: the site reads none of them (each component's page is read from its own folder).
  /^[^/]+\.md$/,
  /^(LICENSE|renovate\.json|knip(\.internal)?\.json|\.jscpd\.json|\.no-bloat\.json|\.gitattributes|tsconfig\.code-map\.json|wrangler\.jsonc|components\/README\.md)$/,
];
const SITE_SPEC = "site/site.spec.ts";
const SWEEP_SPEC = "test/sweep.spec.ts";

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const COMPONENTS = readdirSync("components", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const filesOf = (name) =>
  readdirSync(join("components", name)).filter((f) => /\.(html|ts|tsx|css)$/.test(f));
const cssOf = (name) =>
  read(join("components", name, `${name}.css`)).replace(/\/\*[\s\S]*?\*\//g, "");

// A selector list's parts, split at the commas outside any brackets.
const topLevel = (sel) => {
  const parts = [""];
  let depth = 0;
  for (const ch of sel) {
    if ("([".includes(ch)) depth++;
    else if (")]".includes(ch)) depth--;
    if (ch === "," && depth === 0) parts.push("");
    else parts[parts.length - 1] += ch;
  }
  return parts;
};

// A component whose CSS styles anything outside its own .cap- classes (link.css styles every
// plain <a>) can change any page: a rule outside every .cap- rule, whose selector has a part
// with no .cap- class or [data-cap] marker in it. @-rules pass their scope through; keyframe steps are skipped.
function reachesPast(css) {
  const stack = [];
  let scoped = false;
  for (const m of css.matchAll(/([^{};]*)([{}])/g)) {
    if (m[2] === "}") {
      scoped = stack.pop() ?? false;
      continue;
    }
    const sel = (m[1] ?? "").trim();
    stack.push(scoped);
    if (
      scoped ||
      sel.startsWith("@") ||
      /^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$/.test(sel)
    ) {
      if (sel.startsWith("@keyframes")) scoped = true;
      continue;
    }
    if (topLevel(sel).some((part) => !/\.cap-|\[data-cap\b/.test(part))) return true;
    scoped = true;
  }
  return false;
}

// Each class belongs to the component whose CSS names it most (a toolbar's CSS that styles
// .cap-btn inside it does not make the button's class the toolbar's).
function owners() {
  const best = new Map();
  for (const name of COMPONENTS) {
    const counts = new Map();
    for (const m of cssOf(name).matchAll(/\.(cap-[\w-]+)/g))
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    for (const [cls, n] of counts)
      if (!best.has(cls) || n > best.get(cls).n) best.set(cls, { name, n });
  }
  const own = new Map(COMPONENTS.map((n) => [n, []]));
  for (const [cls, { name }] of best) own.get(name).push(cls);
  return own;
}

// For each component x: who imports x's files (and so renders whatever x renders), and who
// writes one of x's classes in its own markup or wrapper (and so shows x's CSS).
function users() {
  const own = owners();
  const text = new Map(
    COMPONENTS.map((n) => [
      n,
      filesOf(n)
        .map((f) => read(join("components", n, f)))
        .join("\n"),
    ]),
  );
  const words = new Map(COMPONENTS.map((n) => [n, new Set(text.get(n).match(/cap-[\w-]+/g))]));
  const importers = new Map(COMPONENTS.map((n) => [n, []]));
  const writers = new Map(COMPONENTS.map((n) => [n, []]));
  for (const x of COMPONENTS) {
    for (const y of COMPONENTS) {
      if (y === x) continue;
      const t = text.get(y);
      if (t.includes(`../${x}/`) || t.includes(`components/${x}/`)) importers.get(x).push(y);
      else if (own.get(x).some((c) => words.get(y).has(c))) writers.get(x).push(y);
    }
  }
  return { importers, writers };
}

// package.json with only its version changed, against the base commit.
const versionOnly = (base) => {
  const was = (ref) => {
    const { version: _, ...rest } = JSON.parse(
      ref
        ? execFileSync("git", ["show", `${ref}:package.json`], { encoding: "utf8" })
        : read("package.json"),
    );
    return JSON.stringify(rest);
  };
  return was(base) === was(null);
};

function pick(changed, base) {
  const touched = new Set();
  for (const path of changed) {
    const m = /^components\/([^/]+)\/./.exec(path);
    if (m && m[1] !== "README.md") {
      if (!existsSync(join("components", m[1])))
        return { mode: "full", why: `${path}: a removed component` };
      touched.add(m[1]);
    } else if (path === "package.json" && base && versionOnly(base)) continue;
    else if (!UNTESTED.some((re) => re.test(path)))
      return { mode: "full", why: `${path} is shared` };
  }
  for (const name of touched)
    if (reachesPast(cssOf(name)))
      return { mode: "full", why: `${name}'s CSS styles more than its own classes` };
  const all = new Set(touched);
  if (touched.size) {
    // A writer of a changed component's classes is added; an importer of anything added is
    // followed on, since it renders what that one renders. A writer's own writers are not.
    const { importers, writers } = users();
    const queue = [...touched];
    for (const x of touched)
      for (const y of writers.get(x))
        if (!all.has(y)) {
          all.add(y);
          queue.push(y);
        }
    while (queue.length)
      for (const y of importers.get(queue.shift()))
        if (!all.has(y)) {
          all.add(y);
          queue.push(y);
        }
  }
  const names = [...all].sort();
  const specs = names.flatMap((n) =>
    readdirSync(join("components", n))
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => `components/${n}/${f}`),
  );
  const sweep = names.filter((n) => existsSync(join("components", n, "examples.html")));
  if (sweep.length) specs.push(SWEEP_SPEC);
  // The site's spec visits a few components' public pages by name (components/button/).
  if (names.some((n) => read(SITE_SPEC).includes(`components/${n}`))) specs.push(SITE_SPEC);
  if (!specs.length) return { mode: "none", why: "no browser test reads the change" };
  return {
    mode: "some",
    why: `${touched.size} changed, ${names.length} with their users`,
    specs,
    sweep,
  };
}

{
  const args = process.argv.slice(2);
  const at = args.indexOf("--base");
  const base = at >= 0 ? args.splice(at, 2)[1] : "HEAD^1";
  const changed = args.length
    ? args
    : execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" })
        .split("\n")
        .filter(Boolean);
  const r = pick(changed, args.length ? null : base);
  const lines = [
    `mode=${r.mode}`,
    `specs=${(r.specs ?? []).join(" ")}`,
    `sweep=${(r.sweep ?? []).join(",")}`,
  ];
  console.log(`${r.why}\n${lines.join("\n")}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}
