// Types for capsomer/token-check (tokens/token-check.mjs).
export type Block = Record<string, string>;
export type Declarations = Record<string, string[]>;
export function stripCss(css: string): string;
export function readDeclarations(css: string, selector: string): Declarations;
export function resolveToken(block: Block, name: string): { value: string | null; chain: string[] };
