// capsomer/token-check: the checks a site runs over its own CSS's tokens, written once. Pure functions over CSS text
// (no filesystem), so a site's gate reads its stylesheets and passes the text in. The color math is palette-core's
// (contrast, apca): one implementation for Capsomer's own palette check and every site's.
import { normalizeHex } from "@drdustinedwards/site-helpers/text";
import { apca, contrast } from "./palette-core.mjs";

export { apca, contrast };

const HEX = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;
const DECL = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;

/** CSS without comments and with plain newlines, as every reader here expects. */
export function stripCss(css) {
  return css.replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "");
}

const bytes = (hex) => {
  const h = normalizeHex(hex).slice(1);
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
};

/**
 * `color-mix(in srgb, #aaaaaa P%, #bbbbbb)` of two opaque colors as the hex a browser paints (plain interpolation of
 * the 8-bit values), or null for any other expression.
 */
export function flattenMix(expr) {
  const m =
    /^color-mix\(\s*in\s+srgb\s*,\s*(#[0-9a-fA-F]{3,6})\s+([\d.]+)%\s*,\s*(#[0-9a-fA-F]{3,6})\s*\)$/.exec(
      expr.trim(),
    );
  if (!m) return null;
  const p = Number(m[2]) / 100;
  const [from, to] = [bytes(m[1]), bytes(m[3])];
  return `#${[0, 1, 2]
    .map((i) => Math.round(from[i] * p + to[i] * (1 - p)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** The body of the first rule whose selector text is exactly `selector`, or null. Nested blocks are skipped. */
function ruleBody(css, selector) {
  const at = css.indexOf(selector);
  if (at === -1) return null;
  const open = css.indexOf("{", at + selector.length - 1);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && --depth === 0)
      return css.slice(open + 1, i).replace(/\{[^{}]*\}/g, "");
  }
  return null;
}

/** The inside of the first `@media <query> { ... }` block, or null. */
export function mediaBlock(css, query) {
  const head = new RegExp(`@media\\s*${query.replace(/[()]/g, "\\$&")}\\s*\\{`).exec(css);
  if (!head) return null;
  let depth = 0;
  for (let i = head.index + head[0].length - 1; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && --depth === 0) return css.slice(head.index + head[0].length, i);
  }
  return null;
}

/**
 * Every custom property declared in the rule for `selector`, each with all its values in order (a hex then the
 * color-mix it stands for is two). Throws when the selector is missing or declares nothing, so a gate never checks an
 * empty block.
 */
export function readDeclarations(css, selector) {
  const body = ruleBody(stripCss(css), selector);
  if (body === null) throw new Error(`selector not found: ${selector}`);
  const out = {};
  for (const m of body.matchAll(DECL)) (out[m[1]] ??= []).push(m[2].trim());
  if (Object.keys(out).length === 0) throw new Error(`${selector}: parsed zero tokens`);
  return out;
}

/** Each property's first value: what a browser without color-mix() paints. */
export const firstValues = (declarations) =>
  Object.fromEntries(Object.entries(declarations).map(([n, v]) => [n, v[0]]));

/** The selectors Capsomer's families and a site's own palette are written under. */
export const THEME_SELECTORS = {
  light: ':root,\n[data-theme="light"]',
  darkSystem: ':root:not([data-theme="light"])',
  dark: '[data-theme="dark"]',
};

/**
 * A palette's three blocks, `{ light, dark, darkSystem }`, each a map of name to first value. `selectors` names where
 * each is written; a block whose selector is missing is left out. Pass the inside of a `@media (prefers-contrast:
 * more)` block (mediaBlock) to read that tier.
 */
export function readThemeBlocks(css, selectors = THEME_SELECTORS) {
  const out = {};
  for (const [key, selector] of Object.entries(selectors)) {
    try {
      out[key] = firstValues(readDeclarations(css, selector));
    } catch {
      /* Missing: left out, and the caller decides whether that is a failure. */
    }
  }
  return out;
}

/** A token followed through var() chains to its value: `{ value, chain }`, value null when missing or circular. */
export function resolveToken(block, name) {
  const chain = [];
  let current = name;
  for (let i = 0; i <= Object.keys(block).length; i += 1) {
    const raw = block[current];
    if (raw === undefined) return { value: null, chain };
    const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(raw.trim());
    if (!ref) return { value: raw.trim(), chain };
    if (chain.includes(ref[1])) return { value: null, chain };
    chain.push(ref[1]);
    current = ref[1];
  }
  return { value: null, chain };
}

/** Every token in a palette block that does not resolve to a literal hex: `[name, what it resolved to]`. */
export function unresolved(block) {
  return Object.keys(block)
    .map((name) => [name, resolveToken(block, name).value])
    .filter(([, value]) => value === null || !HEX.test(value));
}

/**
 * The fallback rule: a property declared twice is a hex, then the color-mix() it stands for, and the hex must be
 * what the mix paints (within one step per channel). Returns one line per problem.
 */
export function verifyFallbacks(declarations) {
  const problems = [];
  for (const [name, values] of Object.entries(declarations)) {
    if (values.length === 1) continue;
    if (values.length > 2) {
      problems.push(`${name} is declared ${values.length} times; at most a hex and its color-mix`);
      continue;
    }
    const [hex, recipe] = values;
    const painted = flattenMix(recipe);
    if (!painted) {
      problems.push(`${name}'s second value is not a color-mix of two hexes: ${recipe}`);
      continue;
    }
    const close =
      HEX.test(hex) && [0, 1, 2].every((i) => Math.abs(bytes(hex)[i] - bytes(painted)[i]) <= 1);
    if (!close) problems.push(`${name}: ${recipe} paints ${painted}, but the fallback is ${hex}`);
  }
  return problems;
}

/**
 * Measured pairs: each `[fg, bg, min, what]` resolved in the block and held to `min` (WCAG ratio). Returns
 * `{ problems, measured }`, measured carrying the ratio and the APCA Lc for a report. A pair naming a missing token
 * is a problem, never a skip.
 */
export function checkPairs(block, pairs, label = "") {
  const problems = [];
  const measured = [];
  for (const [fgName, bgName, min, what] of pairs) {
    const fg = resolveToken(block, fgName).value;
    const bg = resolveToken(block, bgName).value;
    if (!fg || !bg || !HEX.test(fg) || !HEX.test(bg)) {
      problems.push(`${label}${what}: ${fgName} on ${bgName} names a token that is not a hex`);
      continue;
    }
    const ratio = contrast(normalizeHex(fg), normalizeHex(bg));
    measured.push({ what, fg, bg, ratio, lc: apca(normalizeHex(fg), normalizeHex(bg)) });
    if (ratio < min)
      problems.push(
        `${label}${what}: ${fgName} ${fg} on ${bgName} ${bg} is ${ratio.toFixed(2)}:1, under ${min}:1`,
      );
  }
  return { problems, measured };
}

/**
 * The "no unmeasured token" rule: every color token in the block appears in at least one pair (as fg or bg), or in
 * `exempt` (a decorative stroke, a token only another token reads). Returns the names that do not.
 */
export function unmeasured(block, pairs, exempt = []) {
  const used = new Set(pairs.flatMap(([fg, bg]) => [fg, bg]));
  for (const [fg, bg] of pairs)
    for (const n of [fg, bg]) for (const c of resolveToken(block, n).chain) used.add(c);
  return Object.keys(block).filter(
    (n) => HEX.test(resolveToken(block, n).value ?? "") && !used.has(n) && !exempt.includes(n),
  );
}

/**
 * The opacity ledger: every `opacity` declaration under a selector, so a gate can hold each to a list of the ones
 * allowed (a disabled control, a decorative layer). Returns `{ selector, value }` rows; a value that is not a plain
 * number (var(), calc()) is still returned, never skipped.
 */
export function opacityDeclarations(css) {
  const rows = [];
  for (const m of stripCss(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim().replace(/\s+/g, " ");
    for (const d of m[2].matchAll(/(?:^|;)\s*opacity\s*:\s*([^;]+?)\s*(?:;|$)/g))
      rows.push({ selector, value: d[1] });
  }
  return rows;
}

// ---- raw values ------------------------------------------------------------------------------------------------------
// Every design value in a stylesheet that is written as a literal where a token exists for its kind: colors, spaces,
// font sizes, weights, line heights, tracking, radii, line widths, focus offsets, layers, durations, easings, shadows
// and opacities (the W3C design tokens format's types: color, dimension, fontWeight, number, duration, cubicBezier,
// shadow). Not checked, on purpose: a component's own geometry (a dialog's width, an avatar's size, grid tracks, an
// aspect ratio, a transform, a clip path), which is a component token where a site may change it; values relative to
// the text or the box (em, ch, %, vw, vh), which scale with what they sit in; 0, 1px hairline offsets, and the
// font metric overrides in an @font-face. Defining a custom property with a literal is how a token is made, so only
// a component token whose name says its kind (…-gap, …-weight, …-radius) is checked.

const REM = 16;
const toPx = (n, unit) => (unit === "rem" ? n * REM : n);
const num = (v) => {
  const m = /^(-?\d*\.?\d+)(px|rem|em)?$/.exec(String(v).trim());
  return m ? { n: Number(m[1]), unit: m[2] ?? "" } : null;
};

/**
 * The scales a raw value is matched against, read from Capsomer's tokens.json: [token, value in px, em, ms or a plain
 * number] for each kind, in the order a suggestion prefers them.
 */
export function tokenScale(json) {
  const out = {};
  const put = (kind, name, value) => {
    const m = num(
      typeof value === "object" && value !== null
        ? `${value.value}${value.unit === "ms" ? "" : value.unit}`
        : value,
    );
    if (m) (out[kind] ??= []).push([name, toPx(m.n, m.unit)]);
  };
  const group = (g, kind, keep = () => true) => {
    for (const [name, t] of Object.entries(json[g] ?? {}))
      if (keep(name)) put(kind, name, t.$value);
  };
  group("space", "space");
  group("radius", "radius");
  group("motion", "duration", (n) => n.startsWith("dur-"));
  group("layer", "layer");
  group("focus", "outline", (n) => n === "focus-width");
  group("line", "line", (n) => n.startsWith("line-w"));
  group("line", "outline", (n) => n.startsWith("line-w"));
  group("focus", "line", (n) => n === "ring-width");
  group("focus", "offset", (n) => n.startsWith("focus-offset"));
  group("type", "size", (n) =>
    /^(fs-(tiny|small|label|detail|body|lead|h2|h3)|title-\d(-5)?|display-\d|mono-size)$/.test(n),
  );
  group("layout", "size", (n) => n === "fs-page");
  group("weight", "weight");
  group("leading", "leading");
  group("line-box", "line-box");
  group("tracking", "tracking");
  group("opacity", "opacity");
  out.easing = Object.keys(json.motion ?? {})
    .filter((n) => n.startsWith("ease-"))
    .map((n) => [n, 0]);
  out.shadow = Object.keys(json["color-light"] ?? {})
    .filter((n) => /^shadow-(xs|s|m|l)$/.test(n))
    .map((n) => [n, 0]);
  // The steps whose value changes under data-density="comfortable": the same at rest, larger in a comfortable subtree.
  const roomy = json["density-comfortable"] ?? {};
  out.density = Object.entries(json["density-compact"] ?? {})
    .filter(([n, t]) => JSON.stringify(t.$value) !== JSON.stringify(roomy[n]?.$value))
    .map(([n]) => n);
  return out;
}

const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi;
const HEX_LIT = /#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3,4}\b/gi;
const NAMED =
  /(?<![\w-])(white|black|red|green|blue|gray|grey|silver|orange|yellow|purple|pink|navy|teal)(?![\w-])/gi; // CSS named colors, codespell:ignore
const SPACE_PROP =
  /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-margin|scroll-padding)(-|$)/;
const LINE_PROP =
  /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|column-rule(-width)?|text-decoration-thickness)$/;
const OUTLINE_PROP = /^outline(-width)?$/;
const RADIUS_PROP = /^border(-[a-z]+)*-radius$/;
const MOTION_PROP = /^(transition|animation)(-|$)/;
const LENGTH = /(?<![\w.#-])(-?\d*\.?\d+)(px|rem)\b/g;
// The middle of a fluid size, clamp(min, 1rem + 2vw, max): a slope, not a size.
const SLOPE = /-?\d*\.?\d+(?:rem|px)\s*[+-]\s*-?\d*\.?\d+vw|-?\d*\.?\d+vw/g;

// What a component token's name says it holds. A component token is how a component names its own value, so only one
// that repeats a step of the scale (and should name that step) or holds a color is reported.
const NAMED_KIND = [
  [/-(gap|pad|pad-[a-z-]+|space|spacing|gutter|inset)$/, "space"],
  [/-weight$/, "weight"],
  [/-radius$/, "radius"],
  [/-(duration|dur)$/, "duration"],
  [/-(leading|line-height)$/, "leading"],
  [/-tracking$/, "tracking"],
  [/-(font-size|text-size|fs|size)$/, "size"],
];

const nearest = (scale, value) =>
  scale?.length
    ? scale.reduce((a, t) => (Math.abs(t[1] - value) < Math.abs(a[1] - value) ? t : a))
    : null;

/** Strip url() and strings, and each var() down to its fallback (a raw fallback is a raw value too). */
function bare(value) {
  let v = value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/g, " ");
  for (let at = v.lastIndexOf("var("); at !== -1; at = v.lastIndexOf("var(")) {
    let depth = 0;
    let end = v.length;
    let comma = -1;
    for (let i = at + 3; i < v.length; i += 1) {
      if (v[i] === "(") depth += 1;
      else if (v[i] === ")" && --depth === 0) {
        end = i;
        break;
      } else if (v[i] === "," && depth === 1 && comma === -1) comma = i;
    }
    const fallback = comma === -1 ? "" : v.slice(comma + 1, end);
    v = `${v.slice(0, at)} ${fallback} ${v.slice(end + 1)}`;
  }
  return v;
}

/** The comma-separated parts of a value, ignoring commas inside parentheses. */
const parts = (v) => {
  const out = [""];
  let depth = 0;
  for (const ch of v) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) out.push("");
    else out[out.length - 1] += ch;
  }
  return out;
};

/** Each declaration in a stylesheet: [property, value, line]. Comments and @font-face blocks are skipped. */
function declarations(css) {
  // Comments, @font-face and @media print blocks become spaces, so every line keeps its number. Paper is not themed:
  // print sets black on white.
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let text = css
    .replace(/\r\n/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/@font-face\s*\{[^}]*\}/g, blank);
  for (
    let at = text.search(/@media\s+print\s*\{/);
    at !== -1;
    at = text.search(/@media\s+print\s*\{/)
  ) {
    let depth = 0;
    let end = text.length;
    for (let i = text.indexOf("{", at); i < text.length; i += 1) {
      if (text[i] === "{") depth += 1;
      else if (text[i] === "}" && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    text = text.slice(0, at) + blank(text.slice(at, end)) + text.slice(end);
  }
  const starts = [0];
  for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) starts.push(i + 1);
  const lineAt = (i) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= i) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  return [...text.matchAll(/(?<=^|[;{\s])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)].map((d) => {
    const start = d.index + d[0].length - d[2].length;
    return [d[1], d[2], lineAt(start), start];
  });
}

// A CSS-wide keyword is only valid as a whole value. Inside a shorthand (`font: 400 1rem / 1.5 var(--face, inherit)`)
// the browser drops the whole declaration when the var() falls back, so every longhand it set takes the inherited value.
const WIDE = /(?<![\w-])(inherit|initial|unset|revert-layer|revert)(?![\w-])/;

/** Declarations a browser drops: a CSS-wide keyword, written or reached through a var() fallback, beside other values. */
export function invalidValues(css) {
  const items = [];
  for (const [prop, raw, line] of declarations(css)) {
    if (prop.startsWith("--")) continue;
    const v = bare(raw)
      .replace(/\s*!important\s*$/, "")
      .trim();
    const m = WIDE.exec(v);
    if (m && v !== m[1]) items.push({ line, property: prop, value: raw.trim(), keyword: m[1] });
  }
  return items;
}

/** The font size in px declared in the same rule as the declaration at `at`, as a length or a size token; else null. */
function ruleFontSize(css, at, scale) {
  const open = css.lastIndexOf("{", at);
  const close = css.indexOf("}", at);
  if (open === -1) return null;
  const body = css.slice(open + 1, close === -1 ? css.length : close);
  const m = /(?:^|[;\s])font-size\s*:\s*([^;}]+)/.exec(body);
  if (!m) return null;
  const v = m[1].trim();
  const len = /^(\d*\.?\d+)(px|rem)$/.exec(v);
  if (len) return toPx(Number(len[1]), len[2]);
  const tok = /^var\(--([\w-]+)\)$/.exec(v);
  return tok ? ((scale.size ?? []).find((t) => t[0] === tok[1])?.[1] ?? null) : null;
}

/**
 * The raw design values in one stylesheet, each with its line, kind and the token to use: the exact token when one
 * has the value, else the nearest step of the scale and how far off it is. `scale` is tokenScale(tokens.json).
 */
export function rawValues(css, scale) {
  const items = [];
  // Tokens this stylesheet sets itself: there the token may not hold the scale's value, so a swap is not exact.
  const sets = new Set([...stripCss(css).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1].slice(2)));
  for (const [prop, raw, line, start] of declarations(css)) {
    const own = prop.startsWith("--");
    const v = bare(raw);
    const found = [];
    // [kind, text, value, unit]: value in px, em, ms or a plain number.
    const add = (kind, text, value = 0, unit = "", inExpr = false, ratio = false) =>
      found.push([kind, text, value, unit, inExpr, ratio]);
    // A length inside calc(), min(), max() or clamp() is derived from the values beside it (an icon's width, a
    // control's height), so only one the scale already has is reported there.
    const derived = new Set();
    for (const m of v.matchAll(/\b(?:calc|min|max|clamp|anchor)\(/g)) {
      let depth = 0;
      for (let i = m.index + m[0].length - 1; i < v.length; i += 1) {
        if (v[i] === "(") depth += 1;
        else if (v[i] === ")" && --depth === 0) break;
        derived.add(i);
      }
    }
    const lengths = (kind, s, allow = [0]) => {
      for (const m of s.matchAll(LENGTH)) {
        const px = toPx(Number(m[1]), m[2]);
        if (!allow.includes(Math.abs(px)))
          add(kind, m[0], px, "px", s === v && derived.has(m.index));
      }
    };
    // A color, in any property but a mask (whose black is an alpha, not a color).
    if (!prop.startsWith("mask")) {
      for (const m of v.matchAll(HEX_LIT)) add("color", m[0]);
      for (const m of v.matchAll(COLOR_FN)) add("color", `${m[0]}…)`);
      if (!own && /color|background|fill|stroke|border|outline|shadow/.test(prop))
        for (const m of v.matchAll(NAMED)) add("color", m[0]);
    }
    const kind = own ? (NAMED_KIND.find(([re]) => re.test(prop))?.[1] ?? null) : null;
    if (kind === "space" || (!own && SPACE_PROP.test(prop))) lengths("space", v, [0, 1]);
    else if (kind === "radius" || RADIUS_PROP.test(prop)) {
      for (const m of v.matchAll(LENGTH)) {
        const px = toPx(Number(m[1]), m[2]);
        if (px !== 0) add("radius", m[0], px >= 999 ? 999 : px, "px");
      }
    } else if (LINE_PROP.test(prop)) lengths("line", v);
    else if (OUTLINE_PROP.test(prop)) lengths("outline", v);
    else if (prop === "outline-offset") lengths("offset", v);
    else if (kind === "size" || prop === "font-size") lengths("size", v.replace(SLOPE, " "));
    else if (kind === "tracking" || prop === "letter-spacing") {
      for (const m of v.matchAll(/(?<![\w.#-])(-?\d*\.?\d+)(em|px|rem)\b/g))
        if (Number(m[1]) !== 0)
          add("tracking", m[0], toPx(Number(m[1]), m[2]), m[2] === "em" ? "em" : "px");
    } else if (kind === "weight" || prop === "font-weight") {
      for (const m of v.matchAll(/(?<![\w.-])([1-9]\d{2})(?![\w.%])/g))
        add("weight", m[0], Number(m[1]));
    } else if (kind === "leading" || prop === "line-height") {
      // 0 collapses the line box around an inline image or icon: no line at all, not a leading.
      const m = /^\s*(\d*\.?\d+)(px|rem)?\s*$/.exec(v);
      if (m && Number(m[1]) !== 0) {
        if (!m[2]) add("leading", m[0].trim(), Number(m[1]));
        else if ((scale["line-box"] ?? []).some((t) => t[1] === toPx(Number(m[1]), m[2])))
          add("line-box", m[0].trim(), toPx(Number(m[1]), m[2]), "px");
        else {
          // A length is a line box, not a leading: it is the ratio to the rule's own font size that maps onto the
          // scale. It is never swapped by --fix, because a length inherits as a length and a ratio as a ratio.
          const fs = ruleFontSize(css, start, scale);
          if (fs) add("leading", m[0].trim(), toPx(Number(m[1]), m[2]) / fs, "", false, true);
          else add("leading-length", m[0].trim());
        }
      }
    } else if (prop === "font") {
      const w = /(?:^|\s)([1-9]\d{2})(?=\s)/.exec(v);
      if (w) add("weight", w[1], Number(w[1]));
      lengths("size", v.replace(SLOPE, " ").replace(/\/.*$/, ""));
      const l = /\/\s*(\d*\.?\d+)(?![\w%.])/.exec(v);
      if (l) add("leading", `/${l[1]}`, Number(l[1]));
    } else if (prop === "z-index") {
      // -1, 0 and 1 order siblings inside one component; anything that stacks over other parts is a layer token.
      const m = /^\s*(-?\d+)\s*$/.exec(v);
      if (m && Math.abs(Number(m[1])) > 1) add("layer", m[1], Number(m[1]));
    } else if (kind === "duration" || MOTION_PROP.test(prop)) {
      for (const m of v.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)) {
        const ms = Number(m[1]) * (m[2] === "s" ? 1000 : 1);
        if (ms !== 0) add("duration", m[0], ms, "ms");
      }
      // linear and steps() are a constant speed and a jump, not a curve to choose.
      for (const m of v.matchAll(
        /\bcubic-bezier\(|\blinear\(|(?<![\w-])(ease|ease-in|ease-out|ease-in-out)(?![\w-])/g,
      ))
        add("easing", m[0]);
    } else if (prop === "box-shadow" || prop === "text-shadow") {
      for (const part of parts(v)) {
        const lens = [...part.matchAll(/(?<![\w.#-])(-?\d*\.?\d+)(px|rem)?(?![\w.%(])/g)];
        // A blur makes it a shadow; without one, its offsets and spread draw a line or a bar.
        if (lens.length >= 3 && Number(lens[2][1]) !== 0) add("shadow", part.trim());
        else lengths("line", part);
      }
    } else if (prop === "opacity") {
      const m = /^\s*(\d*\.?\d+)(%)?\s*$/.exec(v);
      if (m) {
        const o = Number(m[1]) / (m[2] ? 100 : 1);
        if (o !== 0 && o !== 1) add("opacity", m[0].trim(), o);
      }
    }
    for (const [k, text, value, unit, inExpr, ratio] of found) {
      const steps = scale[k] ?? [];
      const same = (x) => steps.find((t) => Math.abs(t[1] - x) < 1e-6);
      const exactStep = same(value) ?? (value < 0 ? same(-value) : undefined);
      const near =
        exactStep ?? nearest(steps, steps.some((t) => t[1] < 0) ? value : Math.abs(value));
      const exact = Boolean(exactStep) && !ratio;
      const negate = value < 0 && near && near[1] > 0;
      // A component token reports only a color or a value the scale already has.
      if ((own || inExpr) && k !== "color" && !exact) continue;
      let suggestion;
      if (k === "leading-length")
        suggestion =
          "a unitless leading token, at the ratio to the font size (no font-size in this rule)";
      else if (ratio) {
        const r = Number(value.toFixed(4));
        suggestion = exactStep
          ? `var(--${exactStep[0]}) (${r}x the rule's font size; check children that change size)`
          : `var(--${near[0]}) (${r}x the rule's font size, off scale)`;
      } else if (k === "color" || k === "easing" || k === "shadow")
        suggestion = steps.length
          ? steps.map((t) => `var(--${t[0]})`).join(", ")
          : k === "shadow"
            ? "var(--shadow-xs), var(--shadow-s), var(--shadow-m), var(--shadow-l)"
            : "a color token from the palette";
      else if (!near) suggestion = `a --${k} token`;
      else {
        const tok = negate ? `calc(-1 * var(--${near[0]}))` : `var(--${near[0]})`;
        suggestion = exact ? tok : `${tok} (${near[1]}${unit}, off scale)`;
      }
      // An exact step that is not fixed: it grows under comfortable density, or this stylesheet sets it.
      const moves = !exactStep
        ? undefined
        : (scale.density ?? []).includes(exactStep[0])
          ? "density"
          : sets.has(exactStep[0])
            ? "set here"
            : undefined;
      if (exact && moves)
        suggestion +=
          moves === "density" ? " (grows under comfortable density)" : " (this stylesheet sets it)";
      items.push({ line, text, kind: k, suggestion, exact, moves, start, end: start + raw.length });
    }
  }
  return items;
}

/**
 * The stylesheet with every raw value that has an exact token replaced by it (`capsomer token-check --fix`). Values off
 * the scale, colors, easings and shadows need a person's choice, so they are left for the report; so is a step that
 * grows under comfortable density or that the stylesheet sets itself, where the swap would not draw the same.
 */
export function fixCss(css, scale) {
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  let out = css.replace(/\r\n/g, "\n");
  const edits = [];
  const cursor = new Map();
  for (const it of rawValues(out, scale)) {
    if (!it.exact || it.moves || ["color", "easing", "shadow"].includes(it.kind)) continue;
    const decl = out.slice(it.start, it.end);
    let token = it.suggestion;
    if (it.kind === "size" && token === "var(--fs-small)" && /--mono/.test(decl))
      token = "var(--mono-size)";
    const slash = it.text.startsWith("/");
    if (slash) token = `/ ${token}`;
    const re = new RegExp(
      `${slash ? `\\/\\s*${esc(it.text.slice(1))}` : `(?<![\\w.#-])${esc(it.text)}`}(?![\\w.%])`,
      "g",
    );
    re.lastIndex = cursor.get(it.start) ?? 0;
    const m = re.exec(decl);
    if (!m) continue;
    edits.push([it.start + m.index, m[0].length, token]);
    cursor.set(it.start, m.index + m[0].length);
  }
  for (const [at, length, token] of edits.sort((a, b) => b[0] - a[0]))
    out = out.slice(0, at) + token + out.slice(at + length);
  return out;
}
