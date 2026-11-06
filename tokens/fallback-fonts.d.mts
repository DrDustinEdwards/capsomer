// Types for capsomer/fonts (tokens/fallback-fonts.mjs).
/** A face's metrics in font units, as @capsizecss/unpack's fromBuffer reads them. */
export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  xWidthAvg: number;
}
export type LocalFace = "Arial" | "Courier New" | "Times New Roman" | "Georgia";
/** Each local face's metrics and the local() names it is tried under, its metric twins after it; `bold` is its bold face. */
export const LOCAL: Record<
  LocalFace,
  {
    metrics: FontMetrics;
    src: readonly string[];
    bold: { xWidthAvg: number; src: readonly string[] };
  }
>;
/** A face's average width (xWidthAvg, in its units) at each weight from 550 up, keyed by weight: { 600: 984, 700: 1003 }. */
export type FontWidths = Readonly<Record<number, number>>;
export type MeasuredFamily =
  | "Martian Mono"
  | "DM Sans"
  | "DM Mono"
  | "Source Serif 4"
  | "Montserrat"
  | "Open Sans"
  | "Inter"
  | "Fraunces"
  | "Space Grotesk"
  | "JetBrains Mono"
  | "Overpass"
  | "Jost"
  | "Capsomer Drafting"
  | "DSEG7 Classic";
/** Faces already measured, keyed by family. */
export const MEASURED: Record<
  MeasuredFamily,
  { metrics: FontMetrics; local: LocalFace; widths?: FontWidths }
>;
/** `${family} Fallback`. */
export function fallbackName(family: string): string;
/**
 * The @font-face rule for the size-matched fallback named fallbackName(family). local defaults to Arial.
 * With widths, one rule per weight range: the regular local face for 1 to 549, the bold one from 550.
 */
export function fallbackFontFace(options: {
  family: string;
  metrics: FontMetrics;
  local?: LocalFace;
  widths?: FontWidths;
}): string;
