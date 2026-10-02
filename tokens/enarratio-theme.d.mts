// Structural types for capsomerTheme: the same shape as Enarratio's Theme, so it can be passed
// to Enarratio's stylesheet(), defineTheme() and checkTheme() without Capsomer importing it.
export type HexColor = `#${string}`;
export interface EnarratioScheme {
  background: HexColor;
  text: HexColor;
  mutedText: HexColor;
  grid: HexColor;
  focus: HexColor;
  series: readonly [HexColor, HexColor, HexColor, HexColor, HexColor, HexColor, HexColor, HexColor];
  sequential: readonly [HexColor, HexColor, HexColor, HexColor, HexColor];
  status: { good: HexColor; warning: HexColor; bad: HexColor; unknown: HexColor };
}
export interface EnarratioTheme {
  name: string;
  fonts: { body: string; numeric?: string };
  gridlines: "none" | "x" | "y" | "both";
  light: EnarratioScheme;
  dark: EnarratioScheme;
}
export const capsomerTheme: EnarratioTheme;
