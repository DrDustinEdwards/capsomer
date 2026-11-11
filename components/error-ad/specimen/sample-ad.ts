// A sample ad for the specimen: neutral copy and plain art, made for Capsomer.
import { scopeArt, type Ad } from "../error-ad.ts";

export const SAMPLE_ART = `<symbol id="book" viewBox="0 0 120 150">
  <rect x="6" y="6" width="108" height="138" rx="6" fill="#2f6f8f" stroke="#1b1f3b" stroke-width="5"/>
  <rect x="22" y="30" width="76" height="34" fill="#f4ecd0" stroke="#1b1f3b" stroke-width="3"/>
  <path d="M30 42h60M30 52h44" stroke="#1b1f3b" stroke-width="3"/>
  <rect x="96" y="6" width="10" height="138" fill="#ef3b2d"/>
</symbol>`;

export const SAMPLE_AD: Ad = {
  id: "field-notes",
  title: "Field Notes",
  era: "1950s",
  credit: "Sample art and copy made for Capsomer's specimen.",
  viewBox: [600, 360],
  parts: [
    {
      kind: "text",
      x: 300,
      y: 34,
      anchor: "middle",
      font: "slab",
      size: 22,
      fill: "ink",
      lines: ["FOR EVERY WALK!"],
    },
    {
      kind: "text",
      x: 300,
      y: 118,
      anchor: "middle",
      font: "display",
      size: 78,
      fill: "#ef3b2d",
      stroke: "#1b1f3b",
      strokeWidth: 6,
      shadow: { dx: 5, dy: 5, fill: "#1b1f3b" },
      rotate: -2,
      lines: ["FIELD NOTES!"],
    },
    { kind: "use", ref: "book", x: 60, y: 150, w: 150, h: 190 },
    {
      kind: "burst",
      cx: 200,
      cy: 170,
      outer: 42,
      inner: 30,
      points: 14,
      fill: "#f6c445",
      stroke: "#1b1f3b",
      strokeWidth: 3,
    },
    {
      kind: "text",
      x: 200,
      y: 178,
      anchor: "middle",
      font: "slab",
      size: 16,
      fill: "#1b1f3b",
      rotate: -12,
      lines: ["NEW!"],
    },
    {
      kind: "text",
      x: 400,
      y: 210,
      anchor: "middle",
      font: "serif",
      size: 20,
      leading: 28,
      fill: "ink",
      lines: ["The pocket notebook", "that keeps up", "with you."],
    },
  ],
};

export const SAMPLE = { ...SAMPLE_AD, art: scopeArt(SAMPLE_ART, SAMPLE_AD.id) };
