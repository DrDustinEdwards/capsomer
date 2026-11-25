// The color math: sRGB, OKLab and OKLCH conversion, WCAG 2 contrast, APCA, the floors each role is held to
// and the searches that move a color until it passes. No theme knowledge; tokens/palette-core.mjs builds on it.

export const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  r = toLinear(r);
  g = toLinear(g);
  b = toLinear(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(toGamma);
}

const inGamut = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

// A hex color for oklch(L C H); the chroma is pulled in until the color fits sRGB. L is held to
// 0..1, so a very light or dark seed (the theme builder takes any color) still gets a step 10.
export function oklch(lightness, C, H) {
  const L = Math.min(1, Math.max(0, lightness));
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklabToRgb([
      L,
      c * Math.cos((H * Math.PI) / 180),
      c * Math.sin((H * Math.PI) / 180),
    ]);
    if (inGamut(rgb))
      return (
        "#" +
        rgb
          .map((v) =>
            Math.round(Math.min(1, Math.max(0, v)) * 255)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
      );
  }
  throw new Error(`no sRGB color for oklch(${L} ${C} ${H})`);
}

export const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG 2.x contrast ratio between two hex colors.
export function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// APCA (0.0.98G-4g): the signed Lc of text `txt` on `bg` (positive dark on light). WCAG 2's ratio
// overrates mid-grays on near-black, so dark is held to both. Reference: github.com/Myndex/apca-w3.
const apcaY = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.pow(c, 2.4));
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  return y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y;
};
export function apca(txt, bg) {
  const t = apcaY(txt);
  const b = apcaY(bg);
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) {
    const c = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14;
    return c < 0.1 ? 0 : (c - 0.027) * 100;
  }
  const c = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14;
  return c > -0.1 ? 0 : (c + 0.027) * 100;
}

// The APCA floors (|Lc|) per role, at standard contrast and under prefers-contrast: more:
// 90 body text, 75 running text, 60 other text, 45 fine detail (focus ring, icon), 30 a control's
// border, 15 merely visible. Dividers have no floor at standard contrast.
export const LEVELS = {
  standard: { body: 90, link: 75, read: 60, ring: 45, border: 30, line: 0 },
  more: { body: 90, link: 90, read: 75, ring: 60, border: 45, line: 15 },
};
export const MARGIN = 0.5; // a little above the floor, so rounding to hex cannot fall under it

// True when `fg` meets the WCAG ratio and the APCA floor on every background.
export const readsOn =
  (bgs, ratio, lc = 0) =>
  (fg) =>
    bgs.every(
      (bg) => contrast(fg, bg) >= ratio && Math.abs(apca(fg, bg)) >= lc + (lc ? MARGIN : 0),
    );

// The lightness closest to `from` at which oklch(L C H) passes `ok`. `to` is the high-contrast
// end; the search keeps a lightness that passes.
export function tune(C, H, ok, from, to) {
  let lo = from;
  let hi = to;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ok(oklch(mid, C, H))) hi = mid;
    else lo = mid;
  }
  return oklch(hi, C, H);
}

// `hex` itself when it passes `ok`; otherwise the nearest color of its hue and chroma, its
// lightness moved toward `to` (1 to lighten, 0 to darken), that does.
export function strengthen(hex, ok, to) {
  if (ok(hex)) return hex.toLowerCase();
  const { L, C, H } = seedLch(hex);
  return tune(C, H, ok, L, to);
}

export function seedLch(hex) {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  return { L, C: Math.hypot(a, b), H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}
