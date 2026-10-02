export function docMeta(md: string, fallback: string): { title: string; summary: string };
export function escapeHtml(s: string): string;
export function splitExamples(src: string): { body: string; head: string[]; scripts: string[] };
export function renderStates(input: { template: string; title: string; summary: string; examples: string; hasTsx: boolean }): string;
export function generateStates(root?: string): string[];
