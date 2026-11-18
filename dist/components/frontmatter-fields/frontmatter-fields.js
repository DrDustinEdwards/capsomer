// Frontmatter fields' pure core: which box each top-level key gets, what the box shows, and the
// block it writes back. Reading and writing go through Prelum's frontmatter module (readKey,
// readList, setBlock), so a key whose box was not changed comes back byte for byte, and a key no
// box can say (a nested map, a block scalar, a value with a comment) is never written by a box:
// it is edited in the raw text only. No DOM.
import { blocks as blocksOf, readKey, readList, setBlock, splitFlow, unquote, withoutComment, } from "@drdustinedwards/site-helpers/frontmatter";
export const LIST_HINT = "Separated by commas.";
export const LINES_HINT = "One per line.";
const BOOLEAN_FLAG = { on: "true", off: "false" };
const KEY = /^([A-Za-z_][\w-]*):(.*)$/;
const ITEM = /^\s+-\s+(.*)$/;
// The box a block's shape allows, or null when no box can say it. A block list or flow list whose
// items hold a comma is "lines", since "a, b" could not give them back.
export function shapeOf(lines) {
    const first = (KEY.exec(lines[0] ?? "")?.[2] ?? "").trim();
    const rest = lines.slice(1).filter((l) => l.trim() !== "");
    if (withoutComment(first) !== first || rest.some((l) => l.trim().startsWith("#")))
        return null;
    if (/^[|>&*!{]/.test(first))
        return null;
    if (first.startsWith("[")) {
        if (!first.endsWith("]") || rest.length)
            return null;
        return splitFlow(first.slice(1, -1))
            .map(unquote)
            .some((i) => i.includes(","))
            ? "lines"
            : "list";
    }
    if (first === "" && rest.length) {
        const items = rest.map((l) => ITEM.exec(l)?.[1]);
        if (items.some((i) => i === undefined || /^[-[{|>]/.test(i.trim())))
            return null;
        return items.some((i) => unquote(i ?? "").includes(",")) ? "lines" : "list";
    }
    if (rest.length)
        return null;
    if (first === "true" || first === "false")
        return "flag";
    return "line";
}
const ACRONYMS = new Set(["pov", "url", "id", "seo", "doi", "isbn", "rss"]);
// "pov" reads as "POV", "first_line" as "First line": the key itself is in the raw text.
export function labelOf(key) {
    if (ACRONYMS.has(key.toLowerCase()))
        return key.toUpperCase();
    const words = key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}
// What a box shows for a key.
export function readBox(front, key, box, flag) {
    if (box === "list")
        return readList(front, key).join(", ");
    if (box === "lines")
        return readList(front, key).join("\n");
    if (box === "flag")
        return readKey(front, key) === (flag ?? BOOLEAN_FLAG).on ? (flag ?? BOOLEAN_FLAG).on : "";
    return readKey(front, key);
}
const RESERVED = /^(true|false|yes|no|on|off|null|~)$/i;
const NUMBER = /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$|^0[xo][\da-f]+$/i;
// A scalar as YAML reads it back as the same string: quoted only when it would otherwise be read as
// syntax, a number, a boolean or null. An ISO date stays bare, as sites write it.
export function scalarRaw(value, style = "plain") {
    if (style === "double")
        return JSON.stringify(value);
    if (style === "single")
        return `'${value.replace(/'/g, "''")}'`;
    const needs = value === "" ||
        value !== value.trim() ||
        /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
        /: | #|:$/.test(value) ||
        RESERVED.test(value) ||
        (style !== "number" && NUMBER.test(value));
    return needs ? JSON.stringify(value) : value;
}
const itemRaw = (item) => (/[,[\]{}]/.test(item) ? JSON.stringify(item) : scalarRaw(item));
// The quoting the key's value has now, so an edit writes it the way it was written.
function styleOf(front, key) {
    const block = front === null ? undefined : blocksOf(front).find((b) => b.key === key);
    const first = (KEY.exec(block?.lines[0] ?? "")?.[2] ?? "").trim();
    if (first.startsWith('"'))
        return "double";
    if (first.startsWith("'"))
        return "single";
    return NUMBER.test(first) ? "number" : "plain";
}
// The block a box writes for a value: [] when it is emptied (the key is removed).
export function writeBox(key, box, value, options = {}) {
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
export function setBox(front, key, box, value, flag, keep = false) {
    if (readBox(front, key, box, flag) === value)
        return front;
    const block = blocksOf(front).find((b) => b.key === key);
    let trail = 0;
    while (block &&
        trail < block.lines.length - 1 &&
        block.lines[block.lines.length - 1 - trail]?.trim() === "")
        trail++;
    const lines = writeBox(key, box, value, { flag, style: styleOf(front, key), keep });
    return setBlock(front, key, lines.length ? [...lines, ...Array(trail).fill("")] : []);
}
// Each box the frontmatter gets: the app's specs first, in their order, then the keys it has no spec
// for, in file order. A key whose shape no box can say is raw only, whatever its spec says.
export function typeFront(front, specs = [], options = {}) {
    // Lines before the first key (a comment) belong to no box.
    const blocks = (front === null ? [] : blocksOf(front)).filter((b) => b.key !== null);
    const shapes = new Map(blocks.map((b) => [b.key, shapeOf(b.lines)]));
    const known = new Set(specs.map((s) => s.key));
    const asText = options.extra === "text";
    const rawOnly = blocks
        .filter((b) => shapes.get(b.key) === null || (asText && !known.has(b.key)))
        .map((b) => b.key);
    const make = (key, spec) => {
        const shape = shapes.get(key);
        if (shape === null)
            return null;
        const present = shape !== undefined;
        let box = spec?.box ?? shape ?? "line";
        // A list in the file stays a list: a spec that says one line cannot hold it.
        if (spec?.box &&
            shape &&
            (shape === "list" || shape === "lines") !== (box === "list" || box === "lines"))
            box = shape;
        if (shape === "lines" && box === "list")
            box = "lines";
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
    const fields = [];
    for (const spec of specs) {
        const f = make(spec.key, spec);
        if (f)
            fields.push(f);
    }
    if (!asText) {
        for (const b of blocks) {
            if (known.has(b.key))
                continue;
            const f = make(b.key, undefined);
            if (f)
                fields.push(f);
        }
    }
    return { fields, rawOnly };
}
