// The compare's merge mode: two texts that both moved on from one version (a person's unsaved text, "mine", and a
// newer copy saved elsewhere, "theirs") set side by side, block by block, so nothing is lost and the person takes
// each difference from where they want it. A block is one top-level key of the frontmatter, or one run of the body
// between blank lines. With the version both started from (the base), a block only one side changed starts on that
// side, a block both changed the same way is not a choice, and a block both changed differently starts on mine.
// Without a base, every difference starts on mine. Pure, so a server can plan and the browser can apply the picks.
import { splitSource } from "@drdustinedwards/site-helpers/frontmatter";
import { commonSubsequence, diffWords } from "./draft-compare-diff.js";
export const choicesOf = (plan) => plan.segments.filter((s) => s.kind === "choice");
/** The picks a plan opens on, one per choice, in order. */
export const startPicks = (plan) => choicesOf(plan).map((c) => c.start);
/** The merged source for these picks, one per choice in order (a missing pick is the choice's start). */
export function merged(plan, picks) {
    const blocks = [];
    let i = 0;
    for (const s of plan.segments) {
        if (s.kind === "same") {
            blocks.push(...s.blocks);
            continue;
        }
        const pick = picks[i++] ?? s.start;
        if (pick !== "theirs")
            blocks.push(...s.mine);
        if (pick !== "mine")
            blocks.push(...s.theirs);
    }
    const front = blocks.filter((b) => b.front);
    const body = blocks.filter((b) => !b.front);
    const bodyText = body
        .map((b, at) => {
        if (at === body.length - 1)
            return b.text + (b.gap || "\n");
        // A block that ended its own source is followed by one blank line here.
        return b.text + (/\n[ \t]*\n/.test(b.gap) ? b.gap : "\n\n");
    })
        .join("");
    if (front.length === 0)
        return bodyText;
    return `${plan.open}${front.map((b) => b.text).join("\n")}${plan.close}${bodyText}`;
}
/** The frontmatter's top-level keys, one block each; an indented line, a list item, a blank line or a comment goes with the key above it. */
function frontBlocks(front) {
    const blocks = [];
    for (const line of front.split("\n")) {
        const starts = /^[^\s#-]/.test(line);
        if (starts || blocks.length === 0)
            blocks.push([line]);
        else
            blocks[blocks.length - 1].push(line);
    }
    return blocks.map((lines) => ({ front: true, text: lines.join("\n"), gap: "" }));
}
/** The body's runs between blank lines, each with the blank lines after it. */
function bodyBlocks(body) {
    const parts = body.split(/(\n(?:[ \t]*\n)+|\n$)/);
    const out = [];
    for (let i = 0; i < parts.length; i += 2) {
        const text = parts[i] ?? "";
        const gap = parts[i + 1] ?? "";
        if (text === "") {
            // Blank lines before the first run, or at the very end, go with the run before.
            if (out.length > 0)
                out[out.length - 1].gap += gap;
            continue;
        }
        out.push({ front: false, text, gap });
    }
    return out;
}
function blocksOf(source) {
    const parts = splitSource(source.replace(/\r\n/g, "\n"));
    return [...(parts.front === null ? [] : frontBlocks(parts.front)), ...bodyBlocks(parts.body)];
}
const keyOf = (b) => `${b.front ? "f" : "b"}\u0000${b.text}`;
const same = (a, b) => a.front === b.front && a.text === b.text;
const equal = (a, b) => a.length === b.length && a.every((x, i) => same(x, b[i]));
// Blocks are few (a post has tens, a book chapter hundreds), so the search is never cut short.
const NO_LIMIT = Number.MAX_SAFE_INTEGER;
/** `a` against `b`, block by block, in order: runs both hold, and runs only one holds (removed first). */
function align(a, b) {
    const pairs = commonSubsequence(a.map(keyOf), b.map(keyOf), NO_LIMIT) ?? [];
    const out = [];
    const add = (kind, blocks) => {
        if (blocks.length === 0)
            return;
        const last = out[out.length - 1];
        if (last?.kind === kind)
            last.blocks.push(...blocks);
        else
            out.push({ kind, blocks: [...blocks] });
    };
    let i = 0;
    let j = 0;
    for (const [x, y] of [...pairs, [a.length, b.length]]) {
        add("del", a.slice(i, x));
        add("ins", b.slice(j, y));
        if (x < a.length)
            add("same", [a[x]]);
        i = x + 1;
        j = y + 1;
    }
    return out;
}
/** For each base block, where it sits unchanged in `other`, or -1. */
function matches(base, other) {
    const at = Array.from({ length: base.length }, () => -1);
    let i = 0;
    let j = 0;
    for (const part of align(base, other)) {
        const n = part.blocks.length;
        if (part.kind === "ins")
            j += n;
        else if (part.kind === "del")
            i += n;
        else {
            for (let k = 0; k < n; k++)
                at[i + k] = j + k;
            i += n;
            j += n;
        }
    }
    return at;
}
function choice(mine, theirs, changedBy) {
    const words = mine.length === 1 && theirs.length === 1
        ? diffWords(mine[0].text, theirs[0].text)
        : undefined;
    return {
        kind: "choice",
        mine,
        theirs,
        changedBy,
        start: changedBy === "theirs" ? "theirs" : "mine",
        ...(words ? { words } : {}),
    };
}
/** Pushes a segment, joining runs of blocks that are the same on both sides. */
function push(out, segment) {
    const last = out[out.length - 1];
    if (segment.kind === "same" && last?.kind === "same")
        last.blocks.push(...segment.blocks);
    else
        out.push(segment);
}
/** Where the two texts differ with no base: each run of differences is a choice. */
function twoWay(mine, theirs) {
    const out = [];
    let pending = null;
    const settle = () => {
        if (!pending)
            return;
        const { mine: m, theirs: t } = pending;
        // Paired runs (the same count on both sides) are decided one pair at a time.
        if (m.length === t.length && m.length > 1)
            m.forEach((b, i) => push(out, choice([b], [t[i]], null)));
        else
            push(out, choice(m, t, null));
        pending = null;
    };
    let at = 0;
    for (const part of align(mine, theirs)) {
        const n = part.blocks.length;
        if (part.kind === "same") {
            settle();
            // Mine, so the person's spacing is kept.
            push(out, { kind: "same", blocks: mine.slice(at, at + n) });
            at += n;
            continue;
        }
        pending ??= { mine: [], theirs: [] };
        (part.kind === "del" ? pending.mine : pending.theirs).push(...part.blocks);
        if (part.kind === "del")
            at += n;
    }
    settle();
    return out;
}
/**
 * One run the two sides do not share with the base. Where only one side moved away from the base the run is that
 * side's; where both did, the two are lined up and each difference is judged by whether its blocks are still the base's.
 */
function settleRun(out, mine, theirs, base) {
    if (equal(mine, theirs)) {
        if (mine.length > 0)
            push(out, { kind: "same", blocks: mine });
        return;
    }
    if (equal(mine, base))
        return push(out, choice(mine, theirs, "theirs"));
    if (equal(theirs, base))
        return push(out, choice(mine, theirs, "mine"));
    const inBase = (blocks) => blocks.every((x) => base.some((y) => same(x, y)));
    for (const s of twoWay(mine, theirs)) {
        if (s.kind === "same") {
            push(out, s);
            continue;
        }
        const mb = inBase(s.mine);
        const tb = inBase(s.theirs);
        const by = mb && !tb
            ? "theirs"
            : tb && !mb
                ? "mine"
                : mb && tb && s.mine.length === 0
                    ? "mine"
                    : mb && tb && s.theirs.length === 0
                        ? "theirs"
                        : null;
        push(out, choice(s.mine, s.theirs, by));
    }
}
/** The merge plan for `mine` against `theirs`, over `base` (the version both started from) when it is known. */
export function mergePlan(mine, theirs, base) {
    const m = blocksOf(mine);
    const t = blocksOf(theirs);
    const mineParts = splitSource(mine.replace(/\r\n/g, "\n"));
    const theirParts = splitSource(theirs.replace(/\r\n/g, "\n"));
    const fences = mineParts.front !== null
        ? { open: mineParts.open, close: mineParts.close }
        : theirParts.front !== null
            ? { open: theirParts.open, close: theirParts.close }
            : { open: "---\n", close: "\n---\n\n" };
    if (base === null)
        return { segments: twoWay(m, t), hasBase: false, ...fences };
    const b = blocksOf(base);
    const inMine = matches(b, m);
    const inTheirs = matches(b, t);
    const out = [];
    let i = 0;
    let mi = 0;
    let ti = 0;
    while (i <= b.length) {
        // The next base block both sides still hold, in order: everything before it is one unsettled run.
        let k = i;
        while (k < b.length && !(inMine[k] >= mi && inTheirs[k] >= ti))
            k++;
        const mEnd = k < b.length ? inMine[k] : m.length;
        const tEnd = k < b.length ? inTheirs[k] : t.length;
        settleRun(out, m.slice(mi, mEnd), t.slice(ti, tEnd), b.slice(i, k));
        if (k === b.length)
            break;
        push(out, { kind: "same", blocks: [m[mEnd]] });
        i = k + 1;
        mi = mEnd + 1;
        ti = tEnd + 1;
    }
    return { segments: out, hasBase: true, ...fences };
}
