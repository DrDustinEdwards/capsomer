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
export declare const FAMILIES: Record<"purple" | "fox" | "teal" | "amber" | "navy" | "forest" | "magenta" | "cerulean", Family>;

/** One theme's tokens, by name without the leading --, as hex or CSS values. */
export type Tokens = Record<string, string>;

export interface Pair {
  fg: string;
  bg: string;
  min: number;
  what: string;
  ratio: number;
  pass: boolean;
}

export declare function oklch(L: number, C: number, H: number): string;
export declare function contrast(a: string, b: string): number;
/** A hex color as OKLCH: lightness 0..1, chroma, hue in degrees. */
export declare function seedLch(hex: string): { L: number; C: number; H: number };
export declare function lightStep9(seed: string): string;
export declare function darkStep9(seed: string): string;
export declare function scale(seed: string, anchor?: string | null, scheme?: Scheme): string[];
export declare function familyTheme(seed: string, anchor: string | null, scheme: Scheme, label?: Label): Tokens;
export declare function pairs(t: Tokens): Pair[];
export declare function failures(t: Tokens): string[];
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
};
