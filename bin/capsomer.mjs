#!/usr/bin/env node
// Capsomer's command line. In the capsomer repo it prepares the site's data and reports
// the package's sizes; in an app that installed Capsomer it writes the adoption report and
// checks the app's CSS against the tokens.
//
//   capsomer report [--out capsomer-report.json] [--a11y <playwright json>] [--app <name>]
//   capsomer token-check [paths...] [--fix] [--strict] warns on raw values (--strict fails on one) (rulings.md, rule 1); --fix writes the exact tokens.
//                                          Exits 1 on a declaration the browser drops (invalidValues), a bug, not a warning
//   capsomer size [--dist <dir>]           reports and warns, always exits 0 (decision 12)
//   capsomer states                        writes components/<name>/states.html from examples.html (capsomer repo only)
//   capsomer site-data                     the site's data files (capsomer repo only)
//   capsomer docs                          fails a component doc file that leaves the docs site's pattern (bin/docs.mjs; capsomer repo only)
//   capsomer parts [--out file]            writes parts.json: every component's parts, variants, states and CSS variables (bin/parts.mjs)
//   capsomer fallback-font <file.woff2> [--family name] [--local Arial|"Courier New"|"Times New Roman"|Georgia] [--weight 700=<file.woff2> ...]
//                                          measures a font file (needs @capsizecss/unpack) and prints its fallback's @font-face;
//                                          each --weight adds the face's file at that weight, for the bold fallback rules
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fixCss, invalidValues, rawValues, tokenScale } from "../tokens/token-check.mjs";
import { KB, PKG, args, components, flag, git, readJsonFile, walk } from "./cli.mjs";

const cmd = args[0];

export function tokenCheck(root, paths, { fix = false } = {}) {
  const scale = tokenScale(readJsonFile(join(PKG, "tokens", "tokens.json")));
  const files = (
    paths.length
      ? paths.flatMap((p) => (statSync(p).isDirectory() ? walk(p, [".css"]) : [p]))
      : walk(root, [".css"])
  ).filter(
    (f) =>
      !/[\\/](tokens|site-dist)[\\/]/.test(f) &&
      !/capsomer[\\/]tokens/.test(f) &&
      !/[\\/](fonts-[\w-]+|fallback-fonts)\.css$/.test(f),
  );
  // --fix: every value with an exact token becomes that token first; the report then lists what needs a choice.
  if (fix)
    for (const file of files) {
      const css = readFileSync(file, "utf8");
      const fixed = fixCss(css, scale);
      if (fixed !== css.replace(/\r\n/g, "\n")) writeFileSync(file, fixed);
    }
  const items = files.flatMap((file) =>
    rawValues(readFileSync(file, "utf8"), scale).map((it) => ({
      file: relative(root, file).replace(/\\/g, "/"),
      ...it,
    })),
  );
  const invalid = files.flatMap((file) =>
    invalidValues(readFileSync(file, "utf8")).map((it) => ({
      file: relative(root, file).replace(/\\/g, "/"),
      ...it,
    })),
  );
  return { count: items.length, items, invalid };
}

function installedVersion(root) {
  const lock = join(root, "package-lock.json");
  if (existsSync(lock)) {
    const pkgs = readJsonFile(lock).packages ?? {};
    const entry = pkgs["node_modules/capsomer"];
    if (entry) return { version: entry.version ?? null, resolved: entry.resolved ?? null };
  }
  const pnpm = join(root, "pnpm-lock.yaml");
  if (existsSync(pnpm)) {
    const m = readFileSync(pnpm, "utf8").match(/capsomer@[^\s:]*?#?(v?\d+\.\d+\.\d+)/);
    if (m) return { version: m[1].replace(/^v/, ""), resolved: "pnpm-lock.yaml" };
  }
  const pj = join(root, "node_modules", "capsomer", "package.json");
  if (existsSync(pj)) return { version: readJsonFile(pj).version, resolved: null };
  return { version: null, resolved: null };
}

function a11yFrom(reportPath) {
  if (!reportPath || !existsSync(reportPath))
    return {
      passed: null,
      failed: null,
      source: null,
      note: "No Playwright report given (--a11y <path>).",
    };
  const r = readJsonFile(reportPath);
  let passed = 0;
  let failed = 0;
  const visit = (s) => {
    for (const spec of s.specs ?? []) {
      if (!/accessib|axe|contrast/i.test(spec.title)) continue;
      for (const t of spec.tests ?? []) {
        if (t.status === "expected" || t.status === "flaky") passed++;
        else if (t.status !== "skipped") failed++;
      }
    }
    for (const c of s.suites ?? []) visit(c);
  };
  for (const s of r.suites ?? []) visit(s);
  return { passed, failed, source: relative(process.cwd(), reportPath).replace(/\\/g, "/") };
}

export function report(root) {
  const lib = existsSync(join(root, "node_modules", "capsomer"))
    ? join(root, "node_modules", "capsomer")
    : PKG;
  const catalog = components(lib);
  const files = walk(root, [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".css",
    ".html",
    ".astro",
  ]).filter(
    (f) => !f.includes(`${join("node_modules", "capsomer")}`) && !/\.min\.[cm]?js$/.test(f),
  );
  const used = new Set();
  const own = [];
  let keep = [];
  try {
    keep = JSON.parse(readFileSync(join(root, "capsomer.keep.json"), "utf8"));
  } catch {
    keep = [];
  }
  const kept = (component, file) =>
    keep.find(
      (k) =>
        k.component === component &&
        (k.file === file || (k.file.endsWith("/") && file.startsWith(k.file))),
    );
  const keptHits = [];
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, "/");
    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (const m of text.matchAll(/capsomer\/(?:react\/|behavior\/)?([\w-]+)(?:\.css)?/g))
      if (catalog.some((c) => c.name === m[1])) used.add(m[1]);
    for (const c of catalog) {
      if (c.rootClass && new RegExp(`\\b${c.rootClass}\\b`).test(text)) used.add(c.name);
      for (const signal of [].concat(c.replaces ?? [])) {
        let re;
        try {
          re = new RegExp(signal);
        } catch {
          continue;
        }
        // A line that carries a Capsomer class or imports from capsomer is Capsomer's own markup
        // (role="tablist" on .cap-tabs-list, <dialog class="cap-dialog">), not a copy of it.
        const at = lines.findIndex((l) => re.test(l) && !/(^|[^\w-])cap-[\w-]|capsomer\//.test(l));
        if (at < 0) continue;
        const k = kept(c.name, rel);
        if (k) keptHits.push({ component: c.name, file: rel, reason: k.reason });
        else own.push({ component: c.name, file: rel, line: at + 1 });
        break;
      }
    }
  }
  const tc = tokenCheck(root, []);
  const name = flag(
    "app",
    (() => {
      try {
        return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
      } catch {
        return basename(root);
      }
    })(),
  );
  return {
    schema: 1,
    app: name,
    commit: git(["rev-parse", "HEAD"], root),
    generated: new Date().toISOString(),
    capsomer: installedVersion(root),
    components: { count: used.size, names: [...used].sort() },
    ownCopies: { count: own.length, items: own },
    kept: keptHits,
    tokenWarnings: { count: tc.count, items: tc.items.slice(0, 500) },
    accessibility: a11yFrom(flag("a11y")),
  };
}

async function fallbackFont() {
  const file = args[1];
  if (!file || file.startsWith("--")) {
    console.error(
      'usage: capsomer fallback-font <file.woff2> [--family name] [--local Arial|"Courier New"|"Times New Roman"|Georgia] [--weight 700=<file.woff2> ...]',
    );
    process.exit(1);
  }
  let fromBuffer;
  try {
    ({ fromBuffer } = await import("@capsizecss/unpack"));
  } catch {
    console.error("fallback-font: install @capsizecss/unpack first (npm i -D @capsizecss/unpack)");
    process.exit(1);
  }
  const { fallbackFontFace, LOCAL } = await import("../tokens/fallback-fonts.mjs");
  if (flag("local") && !LOCAL[flag("local")]) {
    console.error(
      `fallback-font: no local face "${flag("local")}"; use one of ${Object.keys(LOCAL).join(", ")}`,
    );
    process.exit(1);
  }
  const m = await fromBuffer(readFileSync(file));
  const family = flag("family", m.familyName);
  // A monospaced face falls back to Courier New, anything else to Arial, unless --local says otherwise.
  const local = flag("local", /mono/i.test(family) ? "Courier New" : "Arial");
  const metrics = {
    ascent: m.ascent,
    descent: m.descent,
    lineGap: m.lineGap,
    unitsPerEm: m.unitsPerEm,
    xWidthAvg: m.xWidthAvg,
  };
  // Each --weight <n>=<file> is the same face at a heavier weight (a static file, or a variable one
  // instanced there), whose average width the bold fallback rules are scaled to.
  const widths = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== "--weight") continue;
    const [weight, path] = (args[i + 1] ?? "").split(/=(.*)/s);
    if (!/^\d+$/.test(weight) || !path) {
      console.error(
        "fallback-font: --weight takes <weight>=<file>, for example --weight 700=bold.woff2",
      );
      process.exit(1);
    }
    widths[weight] = (await fromBuffer(readFileSync(path))).xWidthAvg;
  }
  const measured = Object.keys(widths).length ? { metrics, widths } : { metrics };
  console.log(
    `/* ${basename(file)}, measured with @capsizecss/unpack: ${JSON.stringify(measured)} */`,
  );
  console.log(fallbackFontFace({ family, local, ...measured }));
}

if (cmd === "report") {
  const out = flag("out", "capsomer-report.json");
  const r = report(process.cwd());
  writeFileSync(out, JSON.stringify(r, null, 2) + "\n");
  console.log(
    `report: ${r.app} uses Capsomer ${r.capsomer.version ?? "(not installed)"}: ${r.components.count} components, ${r.ownCopies.count} own copies left, ${r.tokenWarnings.count} token warnings. Wrote ${out}.`,
  );
} else if (cmd === "token-check") {
  const r = tokenCheck(
    process.cwd(),
    args.slice(1).filter((a) => !a.startsWith("--")),
    { fix: args.includes("--fix") },
  );
  for (const it of r.items.slice(0, 200))
    console.warn(`${it.file}:${it.line}: ${it.kind} ${it.text}; use ${it.suggestion}`);
  console.log(
    r.count
      ? `token-check: ${r.count} warning(s). Warnings never fail a build; adding a token is the normal fix.`
      : "token-check: no raw design values found",
  );
  for (const it of r.invalid)
    console.error(
      `${it.file}:${it.line}: ${it.property}: ${it.keyword} is only valid as the whole value, so the browser drops this declaration. Split the shorthand into longhands.`,
    );
  if (r.invalid.length || (args.includes("--strict") && r.count)) process.exitCode = 1;
} else if (cmd === "size") {
  await (await import("./reports.mjs")).size();
} else if (cmd === "weight") {
  const w = (await import("./reports.mjs")).weight(process.cwd());
  const k = (n) => `${(n / KB).toFixed(1)} KB`;
  console.log(
    `${"route".padEnd(44)} ${"js".padStart(10)} ${"css".padStart(10)} ${"total".padStart(10)}`,
  );
  for (const r of w.routes)
    console.log(
      `${r.route.padEnd(44)} ${k(r.js).padStart(10)} ${k(r.css).padStart(10)} ${k(r.total).padStart(10)}`,
    );
  if (w.fontsRaw !== undefined) console.log(`fonts (raw, not budgeted): ${k(w.fontsRaw)}`);
  if (flag("json")) writeFileSync(flag("json"), JSON.stringify(w, null, 2));
  console.log("weight: reported, never a failure");
} else if (cmd === "loc") {
  const { loc, deps } = await import("./reports.mjs");
  const l = loc(process.cwd());
  const total = Object.values(l).reduce((n, r) => n + r.lines, 0);
  for (const [name, r] of Object.entries(l).sort((a, b) => b[1].lines - a[1].lines))
    console.log(
      `${name.padEnd(22)} ${String(r.files).padStart(5)} files ${String(r.lines).padStart(8)} lines`,
    );
  console.log(`${"Total".padEnd(22)} ${"".padStart(11)} ${String(total).padStart(8)} lines`);
  const d = deps(process.cwd());
  console.log(
    `dependencies ${d.dependencies}, dev ${d.devDependencies}, peer ${d.peerDependencies}, installed packages in the lockfile ${d.installedPackages}`,
  );
  if (flag("json"))
    writeFileSync(flag("json"), JSON.stringify({ loc: l, total, deps: d }, null, 2));
} else if (cmd === "bloat") {
  (await import("./reports.mjs")).bloat(process.cwd());
} else if (cmd === "states") {
  // Imported here, not at the top: states.mjs needs site-runtime, a dev dependency, and the
  // commands an app runs from the installed package (report, token-check) must not.
  const { generateStates } = await import("./states.mjs");
  const written = await generateStates(PKG);
  console.log(
    `states: wrote ${written.size} states pages (components/<name>/states.html, generated, gitignored)`,
  );
} else if (cmd === "parts") {
  const { partsOf } = await import("./parts.mjs");
  const out = flag("out", "parts.json");
  const parts = partsOf(PKG);
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, JSON.stringify(parts, null, 2) + "\n");
  console.log(`parts: wrote ${out} (${Object.keys(parts).length} components)`);
} else if (cmd === "docs") {
  const { checkDocs } = await import("./docs.mjs");
  const problems = checkDocs(PKG);
  for (const p of problems) console.error(p);
  console.log(
    problems.length
      ? `docs: ${problems.length} problem(s). A doc file keeps # Title, ## Usage (code) and ## Accessibility only (components/README.md).`
      : "docs: every component doc file keeps the pattern",
  );
  if (problems.length) process.exit(1);
} else if (cmd === "site-data") {
  await (await import("./site-data.mjs")).siteData();
} else if (cmd === "fallback-font") {
  await fallbackFont();
} else {
  console.log(
    "usage: capsomer report | token-check [paths] [--fix] | size [--dist dir] [--json out] | weight [--dist dir] [--json out] | loc [--json out] | bloat --knip f --jscpd f | states | site-data | fallback-font <file.woff2> [--family name] [--local face] [--weight 700=<file.woff2>]",
  );
  process.exit(cmd ? 1 : 0);
}
