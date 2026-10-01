#!/usr/bin/env node
// Capsomer's command line. In the capsomer repo it prepares the site's data and reports
// the package's sizes; in an app that installed Capsomer it writes the adoption report and
// checks the app's CSS against the tokens.
//
//   capsomer report [--out capsomer-report.json] [--a11y <playwright json>] [--app <name>]
//   capsomer token-check [paths...]        warns, always exits 0 (rulings.md, rule 1)
//   capsomer size [--dist <dir>]           reports and warns, always exits 0 (decision 12)
//   capsomer site-data                     the site's data files (capsomer repo only)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const KB = 1024;
const kb = (n) => `${(n / KB).toFixed(1)} KB`;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const readJson = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));

// ---- shared ------------------------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "site-dist", "test-results", "playwright-report", ".wrangler", ".react-router", "coverage"]);

function walk(dir, exts, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, exts, out);
    } else if (exts.includes(extname(e.name))) out.push(p);
  }
  return out;
}

// The doc pages' frontmatter: name, parts, tool, states, added, replaces.
function frontmatter(src) {
  const m = src.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (!m) return data;
  let key = "";
  for (const raw of m[1].split("\n")) {
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && key) {
      (data[key] = Array.isArray(data[key]) ? data[key] : []).push(item[1].replace(/^(['"])(.*)\1$/, "$2"));
      continue;
    }
    const kv = raw.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const v = kv[2].trim();
    data[key] = v.startsWith("[") ? v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean) : v === "" ? [] : v.replace(/^(['"])(.*)\1$/, "$2");
  }
  return data;
}

function components(root) {
  const dir = join(root, "components");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, `${d.name}.md`)))
    .map((d) => {
      const css = join(dir, d.name, `${d.name}.css`);
      // The component's root class is the first cap- class its CSS styles.
      const rootClass = existsSync(css) ? (readFileSync(css, "utf8").match(/\.(cap-[\w-]+)/)?.[1] ?? null) : null;
      return { name: d.name, dir: join(dir, d.name), rootClass, ...frontmatter(readFileSync(join(dir, d.name, `${d.name}.md`), "utf8")) };
    });
}

function git(argsList, cwd) {
  try {
    return execFileSync("git", argsList, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

// ---- token-check -------------------------------------------------------------------------

function lightTokens() {
  const css = readFileSync(join(PKG, "tokens", "colour.css"), "utf8");
  const root = css.slice(css.indexOf(":root {"), css.indexOf("}"));
  return [...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => ({ name: m[1], hex: m[2].toLowerCase() }));
}

const SPACES = [2, 4, 8, 12, 16, 24, 32, 48, 64];
const hexRgb = (h) => {
  const s = h.length === 4 ? h.replace(/^#(.)(.)(.)$/, "#$1$1$2$2$3$3") : h;
  return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Raw colours and off-scale spacing in an app's CSS, each with the nearest token. Generated
// files and Capsomer's own token files are skipped.
export function tokenCheck(root, paths) {
  const tokens = lightTokens();
  const files = (paths.length ? paths.flatMap((p) => (statSync(p).isDirectory() ? walk(p, [".css"]) : [p])) : walk(root, [".css"])).filter(
    (f) => !/[\\/](tokens|site-dist)[\\/]/.test(f) && !/capsomer[\\/]tokens/.test(f),
  );
  const items = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const code = line.replace(/\/\*.*?\*\//g, "");
      if (/^\s*--[\w-]+\s*:/.test(code)) return; // defining a token is the fix, not the fault
      for (const m of code.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) {
        const rgb = hexRgb(m[0].toLowerCase());
        const near = tokens.reduce((a, t) => (dist(hexRgb(t.hex), rgb) < dist(hexRgb(a.hex), rgb) ? t : a));
        items.push({ file: relative(root, file).replace(/\\/g, "/"), line: i + 1, text: m[0], kind: "colour", suggestion: `var(--${near.name})` });
      }
      for (const m of code.matchAll(/\b(?:margin|padding|gap|row-gap|column-gap|inset|top|left|right|bottom)[\w-]*\s*:\s*([^;]+)/g)) {
        for (const px of m[1].matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)px\b/g)) {
          const n = Number(px[1]);
          if (n === 0 || n === 1 || SPACES.includes(n)) continue;
          const near = SPACES.reduce((a, s) => (Math.abs(s - n) < Math.abs(a - n) ? s : a));
          items.push({ file: relative(root, file).replace(/\\/g, "/"), line: i + 1, text: `${n}px`, kind: "space", suggestion: `var(--space-${SPACES.indexOf(near) + 1}) (${near}px)` });
        }
      }
    });
  }
  return { count: items.length, items };
}

// ---- report --------------------------------------------------------------------------------

function installedVersion(root) {
  const lock = join(root, "package-lock.json");
  if (existsSync(lock)) {
    const pkgs = readJson(lock).packages ?? {};
    const entry = pkgs["node_modules/capsomer"];
    if (entry) return { version: entry.version ?? null, resolved: entry.resolved ?? null };
  }
  const pnpm = join(root, "pnpm-lock.yaml");
  if (existsSync(pnpm)) {
    const m = readFileSync(pnpm, "utf8").match(/capsomer@[^\s:]*?#?(v?\d+\.\d+\.\d+)/);
    if (m) return { version: m[1].replace(/^v/, ""), resolved: "pnpm-lock.yaml" };
  }
  const pj = join(root, "node_modules", "capsomer", "package.json");
  if (existsSync(pj)) return { version: readJson(pj).version, resolved: null };
  return { version: null, resolved: null };
}

function a11yFrom(reportPath) {
  if (!reportPath || !existsSync(reportPath)) return { passed: null, failed: null, source: null, note: "No Playwright report given (--a11y <path>)." };
  const r = readJson(reportPath);
  let passed = 0;
  let failed = 0;
  const visit = (s) => {
    for (const spec of s.specs ?? []) {
      if (!/accessib|axe|contrast/i.test(spec.title)) continue;
      for (const t of spec.tests ?? []) (t.status === "expected" || t.status === "flaky" ? passed++ : t.status === "skipped" ? 0 : failed++);
    }
    for (const c of s.suites ?? []) visit(c);
  };
  for (const s of r.suites ?? []) visit(s);
  return { passed, failed, source: relative(process.cwd(), reportPath).replace(/\\/g, "/") };
}

export function report(root) {
  const lib = existsSync(join(root, "node_modules", "capsomer")) ? join(root, "node_modules", "capsomer") : PKG;
  const catalogue = components(lib);
  const files = walk(root, [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".html", ".astro"]).filter((f) => !f.includes(`${join("node_modules", "capsomer")}`));
  const used = new Set();
  const own = [];
  let keep = [];
  try {
    keep = JSON.parse(readFileSync(join(root, "capsomer.keep.json"), "utf8"));
  } catch {
    keep = [];
  }
  const kept = (component, file) => keep.find((k) => k.component === component && (k.file === file || (k.file.endsWith("/") && file.startsWith(k.file))));
  const keptHits = [];
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, "/");
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/capsomer\/(?:react\/|behaviour\/)?([\w-]+)(?:\.css)?/g)) if (catalogue.some((c) => c.name === m[1])) used.add(m[1]);
    for (const c of catalogue) {
      if (c.rootClass && new RegExp(`\\b${c.rootClass}\\b`).test(text)) used.add(c.name);
      for (const signal of [].concat(c.replaces ?? [])) {
        let re;
        try {
          re = new RegExp(signal);
        } catch {
          continue;
        }
        const lines = text.split(/\r?\n/);
        const at = lines.findIndex((l) => re.test(l));
        if (at < 0) continue;
        const k = kept(c.name, rel);
        if (k) keptHits.push({ component: c.name, file: rel, reason: k.reason });
        else own.push({ component: c.name, file: rel, line: at + 1 });
        break;
      }
    }
  }
  const tc = tokenCheck(root, []);
  const name = flag("app", (() => {
    try {
      return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
    } catch {
      return basename(root);
    }
  })());
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

// ---- size ----------------------------------------------------------------------------------

const BUDGET = { base: 3 * KB, css: 15 * KB, behaviour: 10 * KB };

async function size() {
  const rows = [];
  const warn = [];
  const distDir = flag("dist");
  if (distDir) {
    // In an app: the CSS the build ships that carries Capsomer's classes or layers.
    const css = walk(resolve(distDir), [".css"]);
    let total = 0;
    for (const f of css) {
      const buf = readFileSync(f);
      if (!/cap-|@layer cap/.test(buf.toString("utf8"))) continue;
      total += gz(buf);
      rows.push(["app css", relative(distDir, f), gz(buf)]);
    }
    rows.push(["app css", "TOTAL with Capsomer", total]);
    if (total > BUDGET.css * 2) warn.push(`CSS carrying Capsomer is ${kb(total)} gzip; Capsomer's own share should stay near ${kb(BUDGET.css)}.`);
  } else {
    const read = (...p) => readFileSync(join(PKG, ...p));
    const base = gz(Buffer.concat([read("css", "layers.css"), read("tokens", "colour.css"), read("tokens", "scale.css"), read("css", "base.css")]));
    rows.push(["base", "layers, tokens, base", base]);
    if (base > BUDGET.base) warn.push(`Tokens, layers and base are ${kb(base)} gzip, over ${kb(BUDGET.base)}.`);
    let all = base;
    for (const c of components(PKG)) {
      const f = join(c.dir, `${c.name}.css`);
      if (!existsSync(f)) continue;
      const n = gz(readFileSync(f));
      all += n;
      rows.push(["css", c.name, n]);
    }
    rows.push(["css", "TOTAL, every component", all]);
    if (all > BUDGET.css) warn.push(`All Capsomer CSS is ${kb(all)} gzip, over ${kb(BUDGET.css)}.`);
    let js = 0;
    for (const c of components(PKG)) {
      const f = join(PKG, "dist", "components", c.name, `${c.name}.js`);
      if (!existsSync(f)) continue;
      const n = gz(readFileSync(f));
      js += n;
      rows.push(["behaviour", c.name, n]);
    }
    rows.push(["behaviour", existsSync(join(PKG, "dist")) ? "TOTAL, every module" : "TOTAL (run npm run build first)", js]);
    if (js > BUDGET.behaviour) warn.push(`Every behaviour module together is ${kb(js)} gzip, over ${kb(BUDGET.behaviour)}; a page loads only the ones it uses.`);
    for (const [name, n] of await baseUiSizes()) rows.push(["base ui", name, n]);
  }
  const w = Math.max(...rows.map((r) => r[1].length), 10);
  console.log(`${"kind".padEnd(10)}  ${"part".padEnd(w)}  ${"gzip".padStart(9)}`);
  for (const r of rows) console.log(`${r[0].padEnd(10)}  ${r[1].padEnd(w)}  ${kb(r[2]).padStart(9)}`);
  for (const m of warn) console.warn(`size: warning: ${m}`);
  console.log(warn.length ? `size: ${warn.length} warning(s); size never fails a build` : "size: within every budget");
  if (flag("json")) writeFileSync(flag("json"), JSON.stringify({ rows: rows.map(([kind, part, gzip]) => ({ kind, part, gzip })), warnings: warn }, null, 2));
}

// Each Base UI-backed wrapper bundled on its own with React left out, as an app would ship
// it: the honest per-component cost Base UI does not publish.
async function baseUiSizes() {
  const wrappers = components(PKG).filter((c) => /base ui/i.test(String(c.tool ?? "")) && existsSync(join(c.dir, `${c.name}.react.tsx`)));
  if (!wrappers.length) return [];
  let build;
  try {
    ({ build } = await import("vite"));
  } catch {
    return [["(vite not installed)", 0]];
  }
  const out = [];
  for (const c of wrappers) {
    const outDir = join(PKG, "test-results", "size", c.name);
    await build({
      logLevel: "silent",
      configFile: false,
      build: {
        outDir,
        emptyOutDir: true,
        lib: { entry: join(c.dir, `${c.name}.react.tsx`), formats: ["es"], fileName: "bundle" },
        rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"] },
        minify: true,
      },
    });
    const f = walk(outDir, [".js"])[0];
    out.push([`${c.name} (Base UI parts, React excluded)`, f ? gz(readFileSync(f)) : 0]);
  }
  return out;
}

// ---- site-data -----------------------------------------------------------------------------

async function siteData() {
  const dataDir = join(PKG, "site", "data");
  mkdirSync(dataDir, { recursive: true });
  const pal = await import(pathToFileURL(join(PKG, "tokens", "palette.mjs")).href);
  // The committed colours (legacy until rule 14's failing pairs are settled), and every
  // family's pairs for the contrast report.
  writeFileSync(join(dataDir, "palette.json"), JSON.stringify(pal.legacyThemes(), null, 2));
  const scales = Object.fromEntries(Object.entries(pal.FAMILIES).map(([n, f]) => [n, { light: pal.scale(f.seed, f.anchor, "light"), dark: pal.scale(f.seed, f.anchor, "dark") }]));
  writeFileSync(join(dataDir, "families.json"), JSON.stringify({ families: pal.FAMILIES, pairs: pal.report(), scales }, null, 2));
  const pj = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8"));
  const runUrl = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  writeFileSync(join(dataDir, "meta.json"), JSON.stringify({ version: pj.version, commit: git(["rev-parse", "--short", "HEAD"], PKG), branch: git(["branch", "--show-current"], PKG), built: new Date().toISOString(), runUrl }, null, 2));

  const src = join(PKG, "test-results", "results.json");
  const results = { available: false, ran: null, components: {}, totals: { passed: 0, failed: 0, skipped: 0 } };
  if (existsSync(src)) {
    const r = readJson(src);
    results.available = true;
    results.ran = r.stats?.startTime ?? null;
    const visit = (suite, file, theme) => {
      const f = suite.file ?? file;
      const th = /^(light|dark) theme$/.exec(suite.title ?? "")?.[1] ?? theme;
      for (const spec of suite.specs ?? []) {
        const m = /^components\/([\w-]+)\//.exec((f ?? "").replace(/\\/g, "/")) ?? /^site\//.exec((f ?? "").replace(/\\/g, "/"));
        const comp = m?.[1] ?? "site";
        const kind = /^(keyboard|accessibility|behaviour):/.exec(spec.title)?.[1] ?? "behaviour";
        for (const t of spec.tests ?? []) {
          const status = t.status === "expected" || t.status === "flaky" ? "passed" : t.status === "skipped" ? "skipped" : "failed";
          const err = t.results?.at(-1)?.error?.message?.replace(/\u001b\[[0-9;]*m/g, "").split("\n").slice(0, 6).join("\n") ?? null;
          const entry = (results.components[comp] ??= { keyboard: { passed: 0, failed: 0 }, accessibility: { passed: 0, failed: 0 }, behaviour: { passed: 0, failed: 0 }, tests: [] });
          if (status !== "skipped") entry[kind][status]++;
          results.totals[status]++;
          entry.tests.push({ title: spec.title, theme: th ?? null, kind, status, error: status === "failed" ? err : null });
        }
      }
      for (const s of suite.suites ?? []) visit(s, f, th);
    };
    for (const s of r.suites ?? []) visit(s, s.file, null);
  }
  writeFileSync(join(dataDir, "results.json"), JSON.stringify(results, null, 2));
  const resultsOut = flag("results-out");
  if (resultsOut) writeFileSync(resultsOut, JSON.stringify({ ...results, commit: git(["rev-parse", "--short", "HEAD"], PKG), runUrl }, null, 2));
  console.log(`site-data: wrote site/data (palette, meta, results${results.available ? `: ${results.totals.passed} passed, ${results.totals.failed} failed` : ": no test run found"})`);
}

// ---- main ----------------------------------------------------------------------------------

if (cmd === "report") {
  const out = flag("out", "capsomer-report.json");
  const r = report(process.cwd());
  writeFileSync(out, JSON.stringify(r, null, 2) + "\n");
  console.log(`report: ${r.app} uses Capsomer ${r.capsomer.version ?? "(not installed)"}: ${r.components.count} components, ${r.ownCopies.count} own copies left, ${r.tokenWarnings.count} token warnings. Wrote ${out}.`);
} else if (cmd === "token-check") {
  const r = tokenCheck(process.cwd(), args.slice(1).filter((a) => !a.startsWith("--")));
  for (const it of r.items.slice(0, 200)) console.warn(`${it.file}:${it.line}: ${it.kind} ${it.text}; nearest token ${it.suggestion}`);
  console.log(r.count ? `token-check: ${r.count} warning(s). Warnings never fail a build; adding a token is the normal fix.` : "token-check: no raw colours or off-scale spacing found");
} else if (cmd === "size") {
  await size();
} else if (cmd === "site-data") {
  await siteData();
} else {
  console.log("usage: capsomer report | token-check [paths] | size [--dist dir] [--json out] | site-data");
  process.exit(cmd ? 1 : 0);
}
