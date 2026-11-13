// Types for capsomer/token-check (tokens/token-check.mjs).
export { apca, contrast } from "./palette-core.mjs";
export type Block = Record<string, string>;
export type Declarations = Record<string, string[]>;
/** [fg token, bg token, minimum WCAG ratio, what the pair is]. */
export type Pair = readonly [string, string, number, string];
export function stripCss(css: string): string;
export function normalizeHex(hex: string): string;
export function flattenMix(expr: string): string | null;
export function mediaBlock(css: string, query: string): string | null;
export function readDeclarations(css: string, selector: string): Declarations;
export function firstValues(declarations: Declarations): Block;
export const THEME_SELECTORS: { light: string; darkSystem: string; dark: string };
export function readThemeBlocks(
  css: string,
  selectors?: Record<string, string>,
): { light?: Block; dark?: Block; darkSystem?: Block; [key: string]: Block | undefined };
export function resolveToken(block: Block, name: string): { value: string | null; chain: string[] };
export function unresolved(block: Block): [string, string | null][];
export function verifyFallbacks(declarations: Declarations): string[];
export function checkPairs(
  block: Block,
  pairs: readonly Pair[],
  label?: string,
): {
  problems: string[];
  measured: { what: string; fg: string; bg: string; ratio: number; lc: number }[];
};
export function unmeasured(
  block: Block,
  pairs: readonly Pair[],
  exempt?: readonly string[],
): string[];
export function opacityDeclarations(css: string): { selector: string; value: string }[];
