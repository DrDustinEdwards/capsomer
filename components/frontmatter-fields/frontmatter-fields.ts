// Frontmatter fields' pure core: which box each top-level key gets, what the box shows, and the
// block it writes back. Reading and writing go through Prelum's frontmatter module (readKey,
// readList, setBlock), so a key whose box was not changed comes back byte for byte, and a key no
// box can say (a nested map, a block scalar, a value with a comment) is never written by a box:
// it is edited in the raw text only. No DOM.

import { readKey, readList, setBlock } from "@drdustinedwards/site-helpers/frontmatter";

// line: one line of text. text: a longer value in a textarea, still written as one line.
// list: "a, b", written as a flow list [a, b]. lines: one item per line, written as a block list.
// flag: a checkbox that writes one word when on (and another, or nothing, when off).
export type BoxKind = "line" | "text" | "list" | "lines" | "flag";

export interface FlagWords {
  // The value written when the box is checked.
  on: string;
  // The value written when it is not; null removes the key.
  off: string | null;
}

// What the app says about a key it knows: its label, box, help and width. A key without a spec is
// typed from its value and labeled from its name.
export interface FieldSpec {
  key: string;
  label?: string;
  box?: BoxKind;
  help?: string;
  // Spans the whole row. Text and lines boxes are wide unless this says otherwise.
  wide?: boolean;
  // For a flag: the words it writes. Default { on: "true", off: "false" }.
  flag?: FlagWords;
}

export interface TypedField {
  key: string;
  label: string;
  box: BoxKind;
  // What the box shows: a list as "a, b", lines one per line, a flag as its on word or "".
  value: string;
  help?: string;
  wide: boolean;
  flag?: FlagWords;
  // The frontmatter has the key.
  present: boolean;
  // The app gave a spec for it. A box without one keeps its key when emptied (`key: []`,
  // `key: ""`), so the box does not vanish under the typing.
  known: boolean;
}

export interface TypedFront {
  fields: TypedField[];
  // Keys the frontmatter has that no box can say, in file order: edited in the raw text.
  rawOnly: string[];
}

export interface TypeOptions {
  // What happens to a key with no spec: typed into a box ("fields", the default) or left to
  // the raw text ("text").
  extra?: "fields" | "text";
}

export const LIST_HINT = "Separated by commas.";
export const LINES_HINT = "One per line.";
const BOOLEAN_FLAG: FlagWords = { on: "true", off: "false" };

const KEY = /^([A-Za-z_][\w-]*):(.*)$/;

interface Block {
  key: string;
  lines: string[];
}

// The top-level blocks: a key line and every line after it up to the next key line, cut the way
// Prelum's setBlock cuts them so a block this reads is the block that is replaced.
function blocksOf(front: string): Block[] {
  const out: Block[] = [];
  for (const line of front.split(/\r?\n/)) {
    const m = KEY.exec(line);
    if (m) out.push({ key: m[1] ?? "", lines: [line] });
    else out[out.length - 1]?.lines.push(line);
  }
  return out;
}

// A value's text outside its quotes, so a "#" or comma inside quotes is not read as syntax.
function outsideQuotes(v: string): string {
  let out = "";
  let quote = "";
  for (let i = 0; i < v.length; i++) {
    const c = v[i] ?? "";
    if (quote) {
      if (quote === '"' && c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else out += c;
  }
  return out;
}

// Quotes count only where YAML starts one: at the start of a value or inside a flow list (Prelum's
// rule), so the apostrophe in "don't # note" is a letter and the comment is still seen.
const hasComment = (v: string) => /(^|\s)#/.test(/^["'[]/.test(v) ? outsideQuotes(v) : v);
const ITEM = /^\s+-\s+(.*)$/;

// The box a block's shape allows, or null when no box can say it. A block list or flow list whose
// items hold a comma is "lines", since "a, b" could not give them back.
export function shapeOf(lines: readonly string[]): BoxKind | null {
  const first = (KEY.exec(lines[0] ?? "")?.[2] ?? "").trim();
  const rest = lines.slice(1).filter((l) => l.trim() !== "");
  if (hasComment(first) || rest.some((l) => l.trim().startsWith("#"))) return null;
  if (/^[|>&*!{]/.test(first)) return null;
  if (first.startsWith("[")) {
    if (!first.endsWith("]") || rest.length) return null;
    return readFlowItems(first).some((i) => i.includes(",")) ? "lines" : "list";
  }
  if (first === "" && rest.length) {
    const items = rest.map((l) => ITEM.exec(l)?.[1]);
    if (items.some((i) => i === undefined || /^[-[{|>]/.test(i.trim()))) return null;
    return items.some((i) => unquoteItem(i ?? "").includes(",")) ? "lines" : "list";
  }
  if (rest.length) return null;
  if (first === "true" || first === "false") return "flag";
  return "line";
}

function unquoteItem(raw: string): string {
  const v = raw.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    try {
      return JSON.parse(v) as string;
    } catch {
      return v.slice(1, -1);
    }
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'"))
    return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function readFlowItems(flow: string): string[] {
  const inside = flow.slice(1, -1);
  const items: string[] = [];
  let quote = "";
  let start = 0;
  for (let i = 0; i < inside.length; i++) {
    const c = inside[i];
    if (quote) {
      if (quote === '"' && c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ",") {
      items.push(inside.slice(start, i));
      start = i + 1;
    }
  }
  items.push(inside.slice(start));
  return items.map(unquoteItem).filter(Boolean);
}

const ACRONYMS = new Set(["pov", "url", "id", "seo", "doi", "isbn", "rss"]);

// "pov" reads as "POV", "first_line" as "First line": the key itself is in the raw text.
export function labelOf(key: string): string {
  if (ACRONYMS.has(key.toLowerCase())) return key.toUpperCase();
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// What a box shows for a key.
export function readBox(front: string | null, key: string, box: BoxKind, flag?: FlagWords): string {
  if (box === "list") return readList(front, key).join(", ");
  if (box === "lines") return readList(front, key).join("\n");
  if (box === "flag")
    return readKey(front, key) === (flag ?? BOOLEAN_FLAG).on ? (flag ?? BOOLEAN_FLAG).on : "";
  return readKey(front, key);
}

const RESERVED = /^(true|false|yes|no|on|off|null|~)$/i;
const NUMBER = /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$|^0[xo][\da-f]+$/i;

// How a value is written: bare unless it must be quoted ("plain"), bare even when it reads as a
// number ("number": the key held a bare number, so a number typed over it stays one), or quoted.
export type ScalarStyle = "plain" | "number" | "double" | "single";

// A scalar as YAML reads it back as the same string: quoted only when it would otherwise be read as
// syntax, a number, a boolean or null. An ISO date stays bare, as sites write it.
export function scalarRaw(value: string, style: ScalarStyle = "plain"): string {
  if (style === "double") return JSON.stringify(value);
  if (style === "single") return `'${value.replace(/'/g, "''")}'`;
  const needs =
    value === "" ||
    value !== value.trim() ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /: | #|:$/.test(value) ||
    RESERVED.test(value) ||
    (style !== "number" && NUMBER.test(value));
  return needs ? JSON.stringify(value) : value;
}

const itemRaw = (item: string) => (/[,[\]{}]/.test(item) ? JSON.stringify(item) : scalarRaw(item));

// The quoting the key's value has now, so an edit writes it the way it was written.
function styleOf(front: string | null, key: string): ScalarStyle {
  const block = front === null ? undefined : blocksOf(front).find((b) => b.key === key);
  const first = (KEY.exec(block?.lines[0] ?? "")?.[2] ?? "").trim();
  if (first.startsWith('"')) return "double";
  if (first.startsWith("'")) return "single";
  return NUMBER.test(first) ? "number" : "plain";
}

// The block a box writes for a value: [] when it is emptied (the key is removed).
export function writeBox(
  key: string,
  box: BoxKind,
  value: string,
  options: { flag?: FlagWords; style?: ScalarStyle; keep?: boolean } = {},
): string[] {
  const empty = options.keep ? [`${key}: ${box === "list" || box === "lines" ? "[]" : '""'}`] : [];
  if (box === "flag") {
    const words = options.flag ?? BOOLEAN_FLAG;
    const word = value !== "" ? words.on : words.off;
    return word === null ? [] : [`${key}: ${scalarRaw(word, options.style)}`];
  }
  if (box === "list") {
    const items = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return items.length ? [`${key}: [${items.map(itemRaw).join(", ")}]`] : empty;
  }
  if (box === "lines") {
    const items = value
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    return items.length ? [`${key}:`, ...items.map((t) => `  - ${JSON.stringify(t)}`)] : empty;
  }
  const one = value.replace(/\s*\n\s*/g, " ").trim();
  return one === "" ? empty : [`${key}: ${scalarRaw(one, options.style ?? "plain")}`];
}

// The frontmatter with one box's value set. A box that already shows the value leaves the text as
// it was; an emptied box removes its key (or, with `keep`, writes it empty); a key the frontmatter
// lacks is added at the end. The blank lines that followed the block are kept.
export function setBox(
  front: string,
  key: string,
  box: BoxKind,
  value: string,
  flag?: FlagWords,
  keep = false,
): string {
  if (readBox(front, key, box, flag) === value) return front;
  const block = blocksOf(front).find((b) => b.key === key);
  let trail = 0;
  while (
    block &&
    trail < block.lines.length - 1 &&
    block.lines[block.lines.length - 1 - trail]?.trim() === ""
  )
    trail++;
  const lines = writeBox(key, box, value, { flag, style: styleOf(front, key), keep });
  return setBlock(front, key, lines.length ? [...lines, ...Array<string>(trail).fill("")] : []);
}

// Each box the frontmatter gets: the app's specs first, in their order, then the keys it has no spec
// for, in file order. A key whose shape no box can say is raw only, whatever its spec says.
export function typeFront(
  front: string | null,
  specs: readonly FieldSpec[] = [],
  options: TypeOptions = {},
): TypedFront {
  const blocks = front === null ? [] : blocksOf(front);
  const shapes = new Map(blocks.map((b) => [b.key, shapeOf(b.lines)] as const));
  const known = new Set(specs.map((s) => s.key));
  const asText = options.extra === "text";
  const rawOnly = blocks
    .filter((b) => shapes.get(b.key) === null || (asText && !known.has(b.key)))
    .map((b) => b.key);
  const make = (key: string, spec: FieldSpec | undefined): TypedField | null => {
    const shape = shapes.get(key);
    if (shape === null) return null;
    const present = shape !== undefined;
    let box: BoxKind = spec?.box ?? shape ?? "line";
    // A list in the file stays a list: a spec that says one line cannot hold it.
    if (
      spec?.box &&
      shape &&
      (shape === "list" || shape === "lines") !== (box === "list" || box === "lines")
    )
      box = shape;
    if (shape === "lines" && box === "list") box = "lines";
    const flag = box === "flag" ? (spec?.flag ?? BOOLEAN_FLAG) : undefined;
    return {
      key,
      label: spec?.label ?? labelOf(key),
      box,
      value: readBox(front, key, box, flag),
      help: spec?.help ?? (box === "list" ? LIST_HINT : box === "lines" ? LINES_HINT : undefined),
      wide: spec?.wide ?? (box === "text" || box === "lines"),
      flag,
      present,
      known: spec !== undefined,
    };
  };
  const fields: TypedField[] = [];
  for (const spec of specs) {
    const f = make(spec.key, spec);
    if (f) fields.push(f);
  }
  if (!asText) {
    for (const b of blocks) {
      if (known.has(b.key)) continue;
      const f = make(b.key, undefined);
      if (f) fields.push(f);
    }
  }
  return { fields, rawOnly };
}
