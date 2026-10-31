// The theme builder's choices (site/make.ts writes the page, site/make-main.ts runs it): the faces it
// can load, the presets it starts from, and the sizes and corners each setting comes to. The faces are
// self-hosted from @fontsource, as the family sites load them; the site presets are what
// tokens/sites.mjs gives those sites.
import { FAMILIES, MONO_STACK, UI_STACK } from "../tokens/palette-core.mjs";

export type Label = "auto" | "light" | "dark";
export type Density = "compact" | "comfortable";

export const FACES: Record<string, { name: string; stack: string }> = {
  schibsted: { name: "Schibsted Grotesk", stack: UI_STACK },
  "dm-sans": { name: "DM Sans", stack: '"DM Sans", system-ui, sans-serif' },
  inter: { name: "Inter", stack: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif' },
  "open-sans": { name: "Open Sans", stack: '"Open Sans", Arial, sans-serif' },
  montserrat: { name: "Montserrat", stack: '"Montserrat", Helvetica, Arial, sans-serif' },
  fraunces: { name: "Fraunces", stack: '"Fraunces", Georgia, serif' },
  "source-serif": { name: "Source Serif 4", stack: '"Source Serif 4 Variable", "Source Serif 4", Charter, Georgia, serif' },
  system: { name: "The device's own", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  martian: { name: "Martian Mono", stack: MONO_STACK },
  "dm-mono": { name: "DM Mono", stack: '"DM Mono", ui-monospace, monospace' },
  "system-mono": { name: "The device's own", stack: 'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace' },
};
export const TEXT_FACES = ["schibsted", "dm-sans", "inter", "open-sans", "montserrat", "system"];
export const DISPLAY_FACES = ["schibsted", "dm-sans", "inter", "open-sans", "montserrat", "fraunces", "source-serif", "system"];
export const MONO_FACES = ["martian", "dm-mono", "system-mono"];
export const SIZES = [13, 14, 15, 16];

export interface Settings {
  seed: string;
  anchor: string | null;
  label: Label;
  ui: string;
  display: string;
  mono: string;
  size: number;
  radius: number;
  density: Density;
}

const base = { anchor: null, label: "auto" as Label, ui: "schibsted", display: "schibsted", mono: "martian", size: 14, radius: 6, density: "compact" as Density };
const family = (name: keyof typeof FAMILIES): Settings => ({ ...base, seed: FAMILIES[name].seed.toLowerCase(), anchor: FAMILIES[name].anchor?.toLowerCase() ?? null });

export const PRESETS: Array<{ group: string; items: Array<{ id: string; name: string; settings: Settings }> }> = [
  {
    group: "Capsomer's families",
    items: [
      { id: "purple", name: "Purple", settings: family("purple") },
      { id: "fox", name: "Fox", settings: family("fox") },
      { id: "teal", name: "Teal", settings: family("teal") },
      { id: "amber", name: "Amber", settings: family("amber") },
      { id: "navy", name: "Navy", settings: family("navy") },
      { id: "forest", name: "Forest", settings: family("forest") },
      { id: "magenta", name: "Magenta", settings: family("magenta") },
      { id: "cerulean", name: "Cerulean", settings: family("cerulean") },
      { id: "olive", name: "Olive", settings: family("olive") },
      { id: "rose", name: "Rose", settings: family("rose") },
    ],
  },
  {
    group: "Sites built on Capsomer",
    items: [
      // Foxhound's 38px controls and 12px card corners (tokens/sites.mjs) come nearest to comfortable and 7px.
      { id: "foxhound", name: "Foxhound", settings: { ...family("amber"), ui: "dm-sans", display: "dm-sans", mono: "dm-mono", radius: 7, density: "comfortable" } },
      { id: "foxing", name: "Foxing", settings: { ...family("fox"), ui: "dm-sans", display: "fraunces", mono: "dm-mono" } },
      { id: "julieedwards", name: "Julie Edwards", settings: { ...family("forest"), ui: "open-sans", display: "montserrat" } },
      { id: "txasm", name: "TXASM", settings: { ...family("navy"), ui: "inter" } },
    ],
  },
];
export const DEFAULT = family("purple");

/** The type sizes for a body size and density: Capsomer's own at 14px, scaled, in rem (16px each at the default size). */
export function sizes(body: number, density: Density): Record<string, string> {
  const comfy = density === "comfortable";
  const px = (n: number) => `${Math.round(n) / 16}rem`;
  return {
    "fs-label": px(body - (comfy ? 2 : 3)),
    "fs-detail": px(body - 1),
    "fs-body": px(body),
    "fs-lead": px(body + (comfy ? 2 : 1)),
    "fs-h3": px((body * 18) / 14),
    "fs-h2": px((body * 22) / 14),
  };
}

/** The four corners from the middle one: Capsomer's 3, 6, 10 and 14px at 6. */
export function corners(m: number): Record<string, string> {
  const px = (n: number) => `${Math.round(n)}px`;
  return { "radius-s": px(m / 2), "radius-m": px(m), "radius-l": px((m * 5) / 3), "radius-xl": px((m * 7) / 3) };
}

/** Control and row sizes for each density, as tokens/scale.css has them. */
export const DENSITY: Record<Density, Record<string, string>> = {
  compact: { control: "34px", "control-h": "34px", target: "24px", "pad-x": "12px", "pad-y": "7px", "pad-card": "20px", gap: "14px", "row-h": "40px" },
  comfortable: { control: "36px", "control-h": "36px", target: "28px", "pad-x": "12px", "pad-y": "8px", "pad-card": "24px", gap: "16px", "row-h": "44px" },
};
