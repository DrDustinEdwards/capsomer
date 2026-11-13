// parts.json: every component's parts, variants, state hooks and CSS variables, read from its stylesheet (Capsomer
// names a part with a class, `cap-<name>-<part>`, a variant with a data attribute and a state with ARIA or the
// platform, so the stylesheet already says it all; no data-slot). `npm run build` writes dist/parts.json, exported as
// `capsomer/parts.json`; the docs site's anatomy and data-attribute tables read the same function at build.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Attributes that are not a component's own: the specimen hook (components/README.md) and the page-wide theme,
// family and density, which every component follows and none owns.
const NOT_OWN = new Set(["data-force", "data-theme", "data-family", "data-density"]);
// The platform states a stylesheet reads, as written in a selector.
const PSEUDO =
  /:(hover|active|focus-visible|focus-within|focus|disabled|checked|indeterminate|user-invalid|invalid|placeholder-shown|popover-open|modal|target|empty|visited|read-only|open)\b(?!-)/g;

const uncomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const sorted = (set) => [...set].sort();

/** The custom properties a stylesheet declares (`--x: value`), each with its first value. */
function declared(css) {
  const out = new Map();
  for (const m of css.matchAll(/(?<![\w-])--([\w-]+)\s*:\s*([^;}]*)/g))
    if (!out.has(m[1])) out.set(m[1], m[2].trim());
  return out;
}

/** The fallback of each `var(--x, fallback)`, the parentheses balanced. */
function fallbacks(css) {
  const out = new Map();
  for (const m of css.matchAll(/var\(\s*--([\w-]+)\s*,/g)) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    for (; i < css.length && depth; i++) depth += css[i] === "(" ? 1 : css[i] === ")" ? -1 : 0;
    if (!out.has(m[1])) out.set(m[1], css.slice(start, i - 1).trim());
  }
  return out;
}

/** Selector text only: each rule's prelude, so values and strings in declarations are not read as hooks. */
const preludes = (css) =>
  [...css.matchAll(/([^{};]+)\{/g)].map((m) => m[1]).filter((p) => !p.trim().startsWith("@"));

/** Every component with a stylesheet, by name: its root class, own classes, parts, variants, states and variables. */
export function partsOf(root) {
  const dir = join(root, "components");
  const sheets = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, `${d.name}.css`)))
    .map((d) => {
      const css = uncomment(readFileSync(join(dir, d.name, `${d.name}.css`), "utf8"));
      const sel = preludes(css).join("\n");
      return {
        name: d.name,
        css,
        sel,
        classes: new Set([...sel.matchAll(/\.(cap-[\w-]+)/g)].map((m) => m[1])),
      };
    })
    // The root is cap-<name> where the sheet styles it, else the first class it styles (cap-btn for the button).
    .map((s) => ({
      ...s,
      rootClass: s.classes.has(`cap-${s.name}`)
        ? `cap-${s.name}`
        : (s.css.match(/\.(cap-[\w-]+)/)?.[1] ?? null),
    }));
  // The tokens every component reads: declared by the token and base sheets, so not a component's own variable.
  const global = new Set();
  for (const sub of ["tokens", "css"])
    for (const f of readdirSync(join(root, sub)).filter((f) => f.endsWith(".css")))
      for (const k of declared(uncomment(readFileSync(join(root, sub, f), "utf8"))).keys())
        global.add(k);
  // A class belongs to the component whose root names it (the longest root prefix), or, named by no root, to the one
  // stylesheet that styles it.
  const roots = sheets.filter((s) => s.rootClass).map((s) => [s.rootClass, s.name]);
  const styledIn = new Map();
  for (const s of sheets)
    for (const c of s.classes) styledIn.set(c, [...(styledIn.get(c) ?? []), s.name]);
  const ownerOf = (cls) => {
    let best = null;
    for (const [r, name] of roots)
      if ((cls === r || cls.startsWith(`${r}-`)) && (!best || r.length > best[0].length))
        best = [r, name];
    if (best) return best[1];
    const where = styledIn.get(cls) ?? [];
    return where.length === 1 ? where[0] : null;
  };
  const out = {};
  for (const s of sheets) {
    if (!s.rootClass) continue;
    const classes = new Set([...s.classes].filter((c) => ownerOf(c) === s.name));
    const variants = new Map();
    for (const m of s.sel.matchAll(/\[(data-[\w-]+)(?:\s*([~|^$*]?=)\s*"([^"]*)")?\s*\]/g)) {
      if (NOT_OWN.has(m[1])) continue;
      const values = variants.get(m[1]) ?? new Set();
      if (m[3] !== undefined && m[2] === "=") values.add(m[3]);
      variants.set(m[1], values);
    }
    const states = new Set();
    for (const m of s.sel.matchAll(/\[(aria-[\w-]+|open|inert|hidden)(?:\s*=\s*"([^"]*)")?\s*\]/g))
      states.add(m[2] === undefined ? `[${m[1]}]` : `[${m[1]}="${m[2]}"]`);
    for (const m of s.sel.matchAll(PSEUDO)) states.add(`:${m[1]}`);
    const decl = declared(s.css);
    const fall = fallbacks(s.css);
    const read = [...s.css.matchAll(/var\(\s*--([\w-]+)/g)].map((m) => m[1]);
    const vars = sorted(new Set([...decl.keys(), ...read].filter((k) => !global.has(k)))).map(
      (name) => ({ name: `--${name}`, default: decl.get(name) ?? fall.get(name) ?? "" }),
    );
    out[s.name] = {
      root: s.rootClass,
      classes: sorted(classes),
      parts: sorted(classes).filter((c) => c.startsWith(`${s.rootClass}-`)),
      variants: Object.fromEntries(
        sorted(variants.keys()).map((k) => [k, sorted(variants.get(k))]),
      ),
      states: sorted(states),
      vars,
    };
  }
  return out;
}
