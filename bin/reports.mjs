// capsomer size, weight, loc and bloat: the package's size and no-bloat reports. Each only reports; none fails a build.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { inlineCss } from "./build.mjs";
import { PKG, flag, KB, kb, gz, readJsonFile, walk, components, git } from "./cli.mjs";

const BUDGET = { base: 3 * KB, css: 15 * KB, behavior: 10 * KB };

export async function size() {
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
    if (total > BUDGET.css * 2)
      warn.push(
        `CSS carrying Capsomer is ${kb(total)} gzip; Capsomer's own share should stay near ${kb(BUDGET.css)}.`,
      );
  } else {
    const read = (...p) => readFileSync(join(PKG, ...p));
    const base = gz(
      Buffer.concat([
        read("css", "layers.css"),
        read("tokens", "color.css"),
        read("tokens", "scale.css"),
        read("css", "base.css"),
        read("css", "utilities.css"),
      ]),
    );
    rows.push(["base", "layers, tokens, base", base]);
    if (base > BUDGET.base)
      warn.push(`Tokens, layers and base are ${kb(base)} gzip, over ${kb(BUDGET.base)}.`);
    let all = base;
    for (const c of components(PKG)) {
      const f = join(c.dir, `${c.name}.css`);
      if (!existsSync(f)) continue;
      const n = gz(inlineCss(f));
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
      rows.push(["behavior", c.name, n]);
    }
    rows.push([
      "behavior",
      existsSync(join(PKG, "dist")) ? "TOTAL, every module" : "TOTAL (run npm run build first)",
      js,
    ]);
    if (js > BUDGET.behavior)
      warn.push(
        `Every behavior module together is ${kb(js)} gzip, over ${kb(BUDGET.behavior)}; a page loads only the ones it uses.`,
      );
    for (const [name, n] of await baseUiSizes()) rows.push(["base ui", name, n]);
  }
  const w = Math.max(...rows.map((r) => r[1].length), 10);
  console.log(`${"kind".padEnd(10)}  ${"part".padEnd(w)}  ${"gzip".padStart(9)}`);
  for (const r of rows)
    console.log(`${r[0].padEnd(10)}  ${r[1].padEnd(w)}  ${kb(r[2]).padStart(9)}`);
  for (const m of warn) console.warn(`size: warning: ${m}`);
  console.log(
    warn.length
      ? `size: ${warn.length} warning(s); size never fails a build`
      : "size: within every budget",
  );
  if (flag("json"))
    writeFileSync(
      flag("json"),
      JSON.stringify(
        { rows: rows.map(([kind, part, gzip]) => ({ kind, part, gzip })), warnings: warn },
        null,
        2,
      ),
    );
  if (!distDir) writeComponentSizes();
}

// Each component's gzipped CSS and JS in test-results/size.json. Information only: it never
// warns and never fails. JS is the built module in dist when there is one, else the source.
function writeComponentSizes() {
  const out = {};
  for (const c of components(PKG)) {
    const css = join(c.dir, `${c.name}.css`);
    const built = join(PKG, "dist", "components", c.name, `${c.name}.js`);
    const src = join(c.dir, `${c.name}.ts`);
    const js = existsSync(built) ? built : existsSync(src) ? src : null;
    const entry = {
      css: existsSync(css) ? gz(inlineCss(css)) : 0,
      js: js ? gz(readFileSync(js)) : 0,
      jsFrom: js ? (js === built ? "dist" : "source") : null,
    };
    out[c.name] = { ...entry, total: entry.css + entry.js };
  }
  mkdirSync(join(PKG, "test-results"), { recursive: true });
  writeFileSync(
    join(PKG, "test-results", "size.json"),
    JSON.stringify({ unit: "bytes, gzip level 9", components: out }, null, 2),
  );
  console.log("size: wrote test-results/size.json (per component, information only)");
}

// Each Base UI-backed wrapper bundled on its own with React left out, as an app would ship
// it: the honest per-component cost Base UI does not publish.
async function baseUiSizes() {
  const wrappers = components(PKG).filter(
    (c) => /base ui/i.test(String(c.tool ?? "")) && existsSync(join(c.dir, `${c.name}.react.tsx`)),
  );
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
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
        },
        minify: true,
      },
    });
    const f = walk(outDir, [".js"])[0];
    out.push([`${c.name} (Base UI parts, React excluded)`, f ? gz(readFileSync(f)) : 0]);
  }
  return out;
}

// JavaScript and CSS weight per route: for every .html page in a built site, the gzip size of
// the scripts and stylesheets it loads (script src, stylesheet link, modulepreload). Fonts and
// images are counted apart, raw. Reports only; it never fails a build.
export function weight(root) {
  const dist = resolve(root, flag("dist", "site-dist"));
  if (!existsSync(dist)) {
    console.error(`weight: no ${relative(root, dist)}; run npm run site first`);
    return { routes: [], error: "no build" };
  }
  const pages = walk(dist, [".html"]);
  const routes = [];
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const refs = new Set();
    for (const m of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"[^>]*>/g)) {
      const tag = m[0];
      if (/<script/.test(tag) || /rel="(?:stylesheet|modulepreload)"/.test(tag)) refs.add(m[1]);
    }
    let js = 0;
    let css = 0;
    const files = [];
    for (const ref of refs) {
      if (/^https?:/.test(ref)) continue;
      const file = resolve(dist, ref.replace(/^\//, ""));
      if (!existsSync(file)) continue;
      const n = gz(readFileSync(file));
      if (file.endsWith(".css")) css += n;
      else if (/\.m?js$/.test(file)) js += n;
      else continue;
      files.push(relative(dist, file).replace(/\\/g, "/"));
    }
    routes.push({
      route: "/" + relative(dist, page).replace(/\\/g, "/"),
      js,
      css,
      total: js + css,
      files: files.length,
    });
  }
  routes.sort((a, b) => b.total - a.total);
  const fonts = walk(dist, [".woff2", ".woff"]).reduce((n, f) => n + statSync(f).size, 0);
  return { routes, fontsRaw: fonts };
}

// Lines of code by language, over tracked files (so generated and vendored files are out).
export function loc(root) {
  const files = (git(["ls-files"], root) ?? "").split("\n").filter(Boolean);
  const lang = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".mjs": "JavaScript",
    ".js": "JavaScript",
    ".css": "CSS",
    ".html": "HTML",
    ".md": "Markdown",
    ".json": "JSON",
    ".yml": "YAML",
    ".jsonc": "JSON",
  };
  const out = {};
  for (const f of files) {
    if (
      /(^|\/)(package-lock\.json|tokens\/(color|scale|themes)\.css|tokens\/tokens\.json)$/.test(f)
    )
      continue;
    const l = lang[extname(f)];
    if (!l) continue;
    const text = readFileSync(join(root, f), "utf8");
    const row = (out[l] ??= { files: 0, lines: 0 });
    row.files++;
    row.lines += text.split("\n").length;
  }
  return out;
}

export function deps(root) {
  const p = readJsonFile(join(root, "package.json"));
  const lock = existsSync(join(root, "package-lock.json"))
    ? readJsonFile(join(root, "package-lock.json"))
    : null;
  return {
    dependencies: Object.keys(p.dependencies ?? {}).length,
    devDependencies: Object.keys(p.devDependencies ?? {}).length,
    peerDependencies: Object.keys(p.peerDependencies ?? {}).length,
    installedPackages: lock
      ? Object.keys(lock.packages ?? {}).filter((k) => k.startsWith("node_modules/")).length
      : null,
  };
}
// The no-bloat summary for a pull request: Knip's findings, jscpd's duplication and the page
// weight, each against the baseline in no-bloat/baseline.json. Markdown on stdout, for the job
// summary. Warn-only: it reports and always exits 0 (defaults, not laws).
export function bloat(root) {
  const base = existsSync(resolve(root, "no-bloat/baseline.json"))
    ? readJsonFile(resolve(root, "no-bloat/baseline.json"))
    : null;
  const out = ["## No-bloat report (warn only)", ""];
  const delta = (now, then, unit = "") =>
    then == null
      ? `${now}${unit}`
      : `${now}${unit} (baseline ${then}${unit}, ${now - then >= 0 ? "+" : ""}${Math.round((now - then) * 100) / 100}${unit})`;
  const knipFile = flag("knip");
  if (knipFile && existsSync(knipFile)) {
    const j = readJsonFile(knipFile);
    const c = {};
    for (const i of j.issues ?? [])
      for (const [k, v] of Object.entries(i))
        if (Array.isArray(v) && v.length) c[k] = (c[k] ?? 0) + v.length;
    const total = Object.values(c).reduce((n, x) => n + x, 0);
    out.push(
      `**Knip** (public API as entry points): ${delta(total, base?.knip?.total)} findings`,
      `- ${
        Object.entries(c)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ") || "none"
      }`,
      "",
    );
  } else out.push("**Knip:** no report found.", "");
  const jf = flag("jscpd");
  if (jf && existsSync(jf)) {
    const t = readJsonFile(jf).statistics.total;
    out.push(
      `**jscpd:** ${delta(Math.round(t.percentage * 100) / 100, base?.jscpd?.percentage, "%")} duplicated lines, ${delta(t.clones, base?.jscpd?.clones)} clones over ${t.sources} files`,
      "",
    );
  } else out.push("**jscpd:** no report found.", "");
  const w = weight(root);
  if (w.routes?.length) {
    const top = w.routes.slice(0, 5);
    const bw = base?.weight?.largestRouteTotal;
    out.push(
      `**Page weight (gzip JS + CSS):** largest route ${top[0].route} ${(top[0].total / KB).toFixed(1)} KB${bw ? ` (baseline ${(bw / KB).toFixed(1)} KB)` : ""}`,
      "",
      "| route | js | css | total |",
      "| --- | ---: | ---: | ---: |",
      ...top.map(
        (r) =>
          `| ${r.route} | ${(r.js / KB).toFixed(1)} KB | ${(r.css / KB).toFixed(1)} KB | ${(r.total / KB).toFixed(1)} KB |`,
      ),
      "",
    );
  }
  const l = loc(root);
  out.push(
    `**Lines:** ${delta(
      Object.values(l).reduce((n, r) => n + r.lines, 0),
      base?.loc?.total,
    )} across ${Object.keys(l).length} languages`,
    "",
  );
  console.log(out.join("\n"));
}
