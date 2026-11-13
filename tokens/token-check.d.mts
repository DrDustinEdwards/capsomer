// Types for capsomer/token-check (tokens/token-check.mjs).
export type Block = Record<string, string>;
export type Declarations = Record<string, string[]>;
export function stripCss(css: string): string;
export function readDeclarations(css: string, selector: string): Declarations;
export function resolveToken(block: Block, name: string): { value: string | null; chain: string[] };
/** [token, value in px, em, ms or a plain number] for each kind of raw value. */
export type TokenScale = Record<string, [string, number][]>;
export interface RawValue {
  line: number;
  text: string;
  kind: string;
  suggestion: string;
  exact: boolean;
  /** Where the declaration's value starts and ends in the stylesheet. */
  start: number;
  end: number;
}
export function tokenScale(json: Record<string, unknown>): TokenScale;
export function rawValues(css: string, scale: TokenScale): RawValue[];
export function fixCss(css: string, scale: TokenScale): string;
