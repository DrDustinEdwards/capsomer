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
