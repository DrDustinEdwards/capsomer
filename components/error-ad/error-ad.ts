// The ad slot of an error page: one vintage-style ad as a corner piece at the foot of a utility
// page (a 404, a 500). An ad is data (its parts, below) plus SVG symbols for its art; this module
// checks an ad, draws a starburst, scopes an art file's ids, and picks the ad a request gets. Pure
// functions, no framework, so a test and the server run the same code. The ads themselves are the
// site's content. Extracted from dustinedwards.info's utility ads (app/utility-ads/model.mjs).

export interface AdPart {
  kind: "text" | "burst" | "rect" | "use";
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  w?: number;
  h?: number;
  // A symbol's id in the art (kind "use").
  ref?: string;
  anchor?: "start" | "middle" | "end";
  font?: "display" | "slab" | "serif";
  size?: number;
  leading?: number;
  // A hex color, or "ink": the ad's own vintage ink (--cap-ad-ink, the navy its art is drawn in), cream in dark mode.
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: { dx: number; dy: number; fill: string };
  rotate?: number;
  lines?: string[];
  outer?: number;
  inner?: number;
  points?: number;
  color?: string;
}

export interface Ad {
  id: string;
  title: string;
  era: string;
  credit: string;
  viewBox: [number, number];
  parts: AdPart[];
}

// The lettering: two self-hosted Open Font License faces (Bangers, Alfa Slab One) and the site's serif.
export const AD_FONTS = ["display", "slab", "serif"] as const;
const PART_KINDS = ["text", "burst", "rect", "use"];
const ID = /^[a-z][a-z0-9-]*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const isFill = (value: unknown) =>
  value === "ink" || (typeof value === "string" && HEX.test(value));

// Everything wrong with an ad's data, as sentences; an empty list is a valid ad.
// `ad` is a parsed ad.json, `art` its folder's raw art.svg.
export function adProblems(ad: Partial<Ad> | null | undefined, art: string): string[] {
  const out: string[] = [];
  if (typeof ad?.id !== "string" || !ID.test(ad.id)) out.push("id must be kebab-case");
  if (!ad?.title) out.push("title is missing");
  if (!/^19[4-7]0s$/.test(ad?.era ?? "")) out.push("era must be 1940s to 1970s");
  if (!ad?.credit) out.push("credit is missing (say who made the art and copy)");
  const [w, h] = Array.isArray(ad?.viewBox) ? ad.viewBox : [0, 0];
  if (!(w > 0 && h > 0)) out.push("viewBox must be [width, height]");
  const symbols = new Set([...art.matchAll(/<symbol\s+id="([^"]+)"/g)].map((m) => m[1]));
  for (const [i, part] of (ad?.parts ?? []).entries()) {
    const at = `parts[${i}]`;
    if (!PART_KINDS.includes(part.kind)) {
      out.push(`${at}.kind is unknown`);
      continue;
    }
    if (part.kind === "text") {
      if (!AD_FONTS.includes(part.font as (typeof AD_FONTS)[number]))
        out.push(`${at}.font must be one of ${AD_FONTS.join(", ")}`);
      if (!Array.isArray(part.lines) || part.lines.length === 0) out.push(`${at}.lines is empty`);
      if (!isFill(part.fill)) out.push(`${at}.fill must be a hex color or "ink"`);
      if (!((part.size ?? 0) > 0)) out.push(`${at}.size must be positive`);
    }
    if (part.kind === "use" && !symbols.has(part.ref))
      out.push(`${at}.ref "${part.ref}" is not a symbol in art.svg`);
    if (part.kind === "burst" && !((part.outer ?? 0) > (part.inner ?? 0) && (part.inner ?? 0) > 0))
      out.push(`${at} needs outer > inner > 0`);
    const x = part.x ?? part.cx ?? -1;
    const y = part.y ?? part.cy ?? -1;
    if (!(x >= 0 && x <= w && y >= 0 && y <= h))
      out.push(`${at} is placed outside the ${w} by ${h} box`);
  }
  return out;
}

// The points of a starburst: `points` spikes alternating between `outer` and `inner` radius.
export function burstPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    out.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return out.join(" ");
}

// Prefixes an art file's ids (and its internal links) with the ad's id, so two ads' symbols never collide.
export function scopeArt(art: string, adId: string): string {
  return art
    .replace(/\bid="([^"]+)"/g, `id="ad-${adId}-$1"`)
    .replace(/href="#([^"]+)"/g, `href="#ad-${adId}-$1"`);
}

// The ad a request gets: the one `?ad=` names when it exists (so a link can show one), else a random one.
export function chooseAd<T extends { id: string }>(
  ads: T[],
  search: string,
  random: () => number = Math.random,
): T | undefined {
  const named = new URLSearchParams(search).get("ad");
  return ads.find((ad) => ad.id === named) ?? ads[Math.floor(random() * ads.length)];
}
