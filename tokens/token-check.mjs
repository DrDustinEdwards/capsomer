// capsomer/token-check: reading a site's own CSS tokens, written once. Pure functions over CSS text (no
// filesystem), so a site's gate reads its stylesheets and passes the text in (dustinedwards.info's token gate).

const DECL = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;

/** CSS without comments and with plain newlines, as every reader here expects. */
export function stripCss(css) {
  return css.replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** The body of the first rule whose selector text is exactly `selector`, or null. Nested blocks are skipped. */
function ruleBody(css, selector) {
  // The whole prelude: at the start or after a block or a declaration, then the brace, so
  // '[data-theme="dark"]' never matches '[data-theme="dark"] .card'.
  const quoted = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const head = new RegExp(`(?:^|[{};])\\s*${quoted}\\s*\\{`).exec(css);
  if (!head) return null;
  const open = head.index + head[0].length - 1;
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && --depth === 0)
      return css.slice(open + 1, i).replace(/\{[^{}]*\}/g, "");
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
