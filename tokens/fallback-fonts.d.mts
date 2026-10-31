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
/** Each local face's metrics and the local() names it is tried under, its metric twins after it. */
export const LOCAL: Record<LocalFace, { metrics: FontMetrics; src: readonly string[] }>;
export type MeasuredFamily =
  | "Schibsted Grotesk" | "Martian Mono" | "DM Sans" | "DM Mono" | "Source Serif 4"
  | "Montserrat" | "Open Sans" | "Inter" | "Fraunces" | "Space Grotesk" | "JetBrains Mono";
/** Faces already measured, keyed by family. */
export const MEASURED: Record<MeasuredFamily, { metrics: FontMetrics; local: LocalFace }>;
/** `${family} Fallback`. */
export function fallbackName(family: string): string;
/** The @font-face rule for the size-matched fallback named fallbackName(family). local defaults to Arial. */
export function fallbackFontFace(options: { family: string; metrics: FontMetrics; local?: LocalFace }): string;
