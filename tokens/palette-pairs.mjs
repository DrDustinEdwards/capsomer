// Every pair a theme must pass, the hue gaps it must keep and the failures against them.
import { STATUS } from "./palette-families.mjs";
import { LEVELS, apca, contrast, hexToRgb, rgbToOklab } from "./palette-math.mjs";

// Every pair a theme must pass: { fg, bg, min, what, ratio, lcMin, lc, pass }. min is WCAG 2.2's
// ratio (the floor in both themes); lcMin is the APCA floor for the role at `level` (LEVELS).
export function pairs(t, level = "standard") {
  const L = LEVELS[level];
  const out = [];
  const need = (fg, bg, min, what, lcMin = 0) => {
    const ratio = contrast(t[fg], t[bg]);
    const lc = apca(t[fg], t[bg]);
    out.push({ fg, bg, min, what, ratio, lcMin, lc, pass: ratio >= min && Math.abs(lc) >= lcMin });
  };
  // Rulings rule 18: accent text is step 11 (--accent-text) and its hover step 12; the
  // primary button fill is step 10 with its label --primary-fg; step 9 (--accent, the brand
  // color) is held to 3:1 for large fills and never carries text. Accent text reads at the link
  // floor, except where it is the brand color itself (amber's dark theme, Recova's text color).
  const link = t["accent-text"] === t.accent ? L.read : L.link;
  for (const bg of ["surface", "ground", "raised"]) {
    need("text", bg, 4.5, "text", L.body);
    for (const fg of ["muted", "dim", "accent-hover"]) need(fg, bg, 4.5, "text", L.read);
    need("accent-text", bg, 4.5, "accent text", link);
    need("accent-visited", bg, 4.5, "visited link", LEVELS.standard.link);
    for (const s of Object.keys(STATUS)) need(s, bg, 4.5, "status word", L.read);
    if (L.line) need("line", bg, 1, "divider", L.line);
  }
  need("text", "sel", 4.5, "selected row title", L.read);
  need("muted", "sel", 4.5, "selected row detail", L.read);
  need("text", "sunken", 4.5, "command block", L.read);
  need("dim", "sunken", 4.5, "command block note", L.read);
  for (const bg of ["surface", "ground", "raised"])
    need("line-strong", bg, 3, "control border", L.border);
  need("accent-line", "sel", 3, "selection ring", L.border);
  for (const bg of ["surface", "ground", "raised"]) {
    need("ring", bg, 3, "focus ring", L.ring);
    need("accent", bg, 3, "brand color as a large fill");
    need("primary-line", bg, 3, "primary button edge against its surroundings");
  }
  for (const bg of ["surface", "ground", "raised"])
    need("on", bg, 3, "checked box or on switch against its surroundings");
  need("on-hover", "surface", 3, "on switch (hover) against its surroundings");
  // A tick is a bold glyph inside a filled box; the box's fill carries the state, so the tick is
  // held to the standard border floor at either level (amber's light step 9, the darkest amber
  // that still stands 3:1 off a light page, gives its dark tick Lc 43.5).
  need("primary-fg", "on", 3, "tick on a checked box", LEVELS.standard.border);
  need("surface", "on", 3, "thumb of an on switch");
  need("surface", "on-hover", 3, "thumb of an on switch (hover)");
  for (const s of Object.keys(STATUS)) {
    need(s, `${s}-soft`, 4.5, "pill", L.read);
    need(s, "accent-soft", 4.5, "count on the active menu item", L.read);
    need(s, "sel", 4.5, "status word on a selected row", L.read);
  }
  need("accent-text", "accent-soft", 4.5, "active item", L.read);
  // A text link under the pointer and pressed (css/base.css) and a tag pill (components/link), at
  // the reading floor: a passing state, or a visited color, held to the standard floors at either level.
  need("accent-hover", "accent-soft", 4.5, "link under the pointer", L.read);
  need("accent-hover", "accent-5", 4.5, "pressed link", L.read);
  need("accent-hover", "accent-6", 4.5, "pressed tag", L.read);
  need("accent-visited", "accent-soft", 4.5, "visited tag", LEVELS.standard.read);
  need("accent-text", "sel", 4.5, "deep accent text", L.read);
  need("primary-fg", "primary", 4.5, "primary button label", L.read);
  need("primary-fg", "primary-hover", 4.5, "primary button label (hover)", L.read);
  need("surface", "crit", 4.5, "badge label", L.read);
  need("on-sign", "sign", 4.5, "sign type", L.read);
  need("on-sign-here", "sign-here", 7, "the page you are on, in a direction strip (AAA)", L.read);
  need("on-sign", "sign-here", 4.5, "a direction strip's type over the you-are-here box", L.read);
  need("lit-bulb", "sign", 7, "a lit countdown on a panel", L.read);
  for (const bg of ["ground", "surface"]) need("sign-edge", bg, 3, "sign edge against the page");
  return out;
}

// Colors that must look apart, not only read: a visited link against an unvisited one and against
// body text, as OKLab distance times 100 (about 2 is the smallest difference a person sees side by
// side; 7 is plain across a page).
export function apart(t) {
  const lab = (hex) => rgbToOklab(hexToRgb(hex));
  const dist = (a, b) => 100 * Math.hypot(...lab(t[a]).map((v, i) => v - lab(t[b])[i]));
  return [
    ["accent-visited", "accent-text", 7, "visited link apart from a link"],
    ["accent-visited", "text", 10, "visited link apart from body text"],
  ].map(([a, b, min, what]) => ({ a, b, min, what, d: dist(a, b), pass: dist(a, b) >= min }));
}

export function failures(t, level = "standard") {
  return [
    ...pairs(t, level)
      .filter((p) => !p.pass)
      .map(
        (p) =>
          `${p.what}: --${p.fg} ${t[p.fg]} on --${p.bg} ${t[p.bg]} is ${p.ratio.toFixed(2)}:1 and Lc ${Math.abs(p.lc).toFixed(1)}, needs ${p.min}:1${p.lcMin ? ` and Lc ${p.lcMin}` : ""}`,
      ),
    ...apart(t)
      .filter((x) => !x.pass)
      .map(
        (x) =>
          `${x.what}: --${x.a} ${t[x.a]} and --${x.b} ${t[x.b]} are ${x.d.toFixed(1)} apart (OKLab x 100), need ${x.min}`,
      ),
  ];
}
