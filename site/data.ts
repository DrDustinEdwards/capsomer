// What the site reads at build time: every component's doc page, the palette with its
// asserted pairs, the last test run, the scales, and the repo's own pages. The data files
// come from `capsomer site-data`, which CI runs after the tests and before the build.
import { frontmatter } from "./markdown.ts";
import tokensJson from "../tokens/tokens.json";

export interface ComponentDoc {
  name: string;
  title: string;
  summary: string;
  tool: string;
  parts: string[];
  states: string[];
  added: string;
  source: string;
  body: string;
}

const docs = import.meta.glob("../components/*/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export const COMPONENTS: ComponentDoc[] = Object.entries(docs)
  .filter(([path]) => {
    const m = /components\/([\w-]+)\/([\w-]+)\.md$/.exec(path);
    return m && m[1] === m[2];
  })
  .map(([path, src]) => {
    const { data, body } = frontmatter(src);
    const name = /components\/([\w-]+)\//.exec(path)?.[1] ?? path;
    const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
    const list = (k: string) => (Array.isArray(data[k]) ? (data[k] as string[]) : str(k) ? [str(k)] : []);
    return { name, title: str("title") || name, summary: str("summary"), tool: str("tool"), parts: list("parts"), states: list("states"), added: str("added"), source: str("source"), body };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export interface Pair {
  fg: string;
  bg: string;
  min: number;
  what: string;
  ratio: number;
  pass: boolean;
}
export interface Palette {
  seed: string;
  order: string[];
  light: { tokens: Record<string, string>; pairs: Pair[] };
  dark: { tokens: Record<string, string>; pairs: Pair[] };
}

export interface TestRow {
  title: string;
  theme: "light" | "dark" | null;
  kind: "keyboard" | "accessibility" | "behaviour";
  status: "passed" | "failed" | "skipped";
  error: string | null;
}
export interface ComponentResults {
  keyboard: { passed: number; failed: number };
  accessibility: { passed: number; failed: number };
  behaviour: { passed: number; failed: number };
  tests: TestRow[];
}
export interface Results {
  available: boolean;
  ran: string | null;
  components: Record<string, ComponentResults>;
  totals: { passed: number; failed: number; skipped: number };
}
export interface Meta {
  version: string;
  commit: string | null;
  branch: string | null;
  built: string;
  runUrl: string | null;
}

const data = import.meta.glob("./data/*.json", { import: "default", eager: true }) as Record<string, unknown>;
export const PALETTE = (data["./data/palette.json"] ?? null) as Palette | null;
export const RESULTS = (data["./data/results.json"] ?? { available: false, ran: null, components: {}, totals: { passed: 0, failed: 0, skipped: 0 } }) as Results;
export const META = (data["./data/meta.json"] ?? { version: "0.1.0", commit: null, branch: null, built: "", runUrl: null }) as Meta;

type TokenGroup = Record<string, { $value: unknown; $description?: string }>;
export const SCALES = tokensJson as unknown as Record<string, TokenGroup>;

const pages = import.meta.glob("../*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const DEFAULTS_MD = pages["../DEFAULTS.md"] ?? "";
export const CHANGELOG_MD = pages["../CHANGELOG.md"] ?? "";

export const BASE = import.meta.env.BASE_URL;
