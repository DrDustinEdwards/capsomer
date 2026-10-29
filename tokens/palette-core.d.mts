// Types for tokens/palette-core.mjs, the color generator a browser can run (the site's theme builder).

export type Scheme = "light" | "dark";
/** The label on a primary fill: "dark" for a family too light to carry white (amber). */
export type Label = "light" | "dark";

export interface Family {
  seed: string;
  anchor: string | null;
  label?: Label;
  defaultTheme: Scheme;
  note: string;
}
export declare const FAMILIES: Record<"purple" | "fox" | "teal" | "amber" | "navy" | "forest" | "magenta" | "cerulean" | "olive" | "rose", Family>;

/** One theme's tokens, by name without the leading --, as hex or CSS values. */
export type Tokens = Record<string, string>;

/** "standard", or "more" under the viewer's increase-contrast setting (prefers-contrast: more). */
export type Level = "standard" | "more";

export interface Pair {
  fg: string;
  bg: string;
  /** WCAG 2.2 ratio the pair needs. */
  min: number;
  what: string;
  ratio: number;
  /** APCA floor (|Lc|) the pair needs; 0 for none. */
  lcMin: number;
  /** APCA Lc of fg on bg, signed. */
  lc: number;
  pass: boolean;
}

/** APCA floors (|Lc|) per role at each level. */
export declare const LEVELS: Record<Level, { body: number; link: number; read: number; ring: number; border: number; line: number }>;

export declare function oklch(L: number, C: number, H: number): string;
export declare function contrast(a: string, b: string): number;
/** APCA 0.0.98G-4g Lc of text `txt` on `bg`, signed. */
export declare function apca(txt: string, bg: string): number;
/** `hex` when it passes `ok`, else the nearest color of its hue and chroma, lightness moved toward `to`, that does. */
export declare function strengthen(hex: string, ok: (hex: string) => boolean, to: number): string;
/** Body, muted and dim text, the control border and the divider, held to `level` against the theme's grounds. */
export declare function fitNeutrals(t: Tokens, scheme: Scheme, level?: Level): Tokens;
/** CSS custom-property lines for the tokens `more` changes from `base`. */
export declare function moreLines(base: Tokens, more: Tokens, indent: string): string;
/** A hex color as OKLCH: lightness 0..1, chroma, hue in degrees. */
export declare function seedLch(hex: string): { L: number; C: number; H: number };
export declare function lightStep9(seed: string): string;
export declare function darkStep9(seed: string): string;
export declare function scale(seed: string, anchor?: string | null, scheme?: Scheme): string[];
export declare function familyTheme(seed: string, anchor: string | null, scheme: Scheme, label?: Label, level?: Level): Tokens;
export declare function pairs(t: Tokens, level?: Level): Pair[];
export declare function failures(t: Tokens, level?: Level): string[];
export declare const FAMILY_ORDER: string[];
export declare const CHART_ORDER: string[];
export declare const ELEVATION_ORDER: string[];
export declare function renderFamily(seed: string, anchor?: string | null, label?: Label): string;
export declare function renderScoped(name: string, family: { seed: string; anchor?: string | null; label?: Label }): string;
export declare function renderMarks(): string;
export declare function themes(family: { seed: string; anchor?: string | null; label?: Label }): {
  seed: string;
  anchor: string | null;
  order: string[];
  elevation: string[];
  light: { tokens: Tokens; pairs: Pair[] };
  dark: { tokens: Tokens; pairs: Pair[] };
  lightMore: { tokens: Tokens; pairs: Pair[] };
  darkMore: { tokens: Tokens; pairs: Pair[] };
};
