// The markdown editor's types and pure helpers: the edits each command makes, counted and checked without a page (markdown-editor.ts).
// ---- pure helpers --------------------------------------------------------------------------
export const LINK_RESULT_LIMIT = 8;
const DEFAULT_WORDS_PER_MINUTE = 200;
// Markdown syntax counts as words on purpose: it is the count the site's published reading
// times were built with.
export function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
export function minutesForWords(words, wordsPerMinute = DEFAULT_WORDS_PER_MINUTE) {
    return Math.max(1, Math.round(words / wordsPerMinute));
}
export function looksLikeUrl(text) {
    return /^(https?:\/\/|mailto:|\/|#)/i.test(text.trim());
}
// The targets whose title, address or hint holds the query; all of them for an empty query.
// A typed address matches nothing: it is committed as itself.
export function filterLinkTargets(targets, query, limit = LINK_RESULT_LIMIT) {
    const needle = query.trim().toLowerCase();
    if (looksLikeUrl(needle))
        return [];
    const pool = needle
        ? targets.filter((t) => [t.title, t.href, t.hint ?? ""].some((s) => s.toLowerCase().includes(needle)))
        : targets;
    return pool.slice(0, limit);
}
// The start and end of the line holding `pos`.
export function lineBounds(doc, pos) {
    const from = doc.lastIndexOf("\n", pos - 1) + 1;
    const nl = doc.indexOf("\n", pos);
    return { from, to: nl === -1 ? doc.length : nl };
}
// Marks around the selection; with none selected, the cursor lands between the marks.
export function wrapEdit(doc, from, to, before, after = before) {
    const selected = doc.slice(from, to);
    return {
        changes: [{ from, to, insert: `${before}${selected}${after}` }],
        anchor: from + before.length,
        head: selected ? from + before.length + selected.length : undefined,
    };
}
// Cycles the line's heading: none, h2, h3, h4, none.
export function headingEdit(doc, head) {
    const { from, to } = lineBounds(doc, head);
    const line = doc.slice(from, to);
    const match = /^(#{1,6})\s+/.exec(line);
    const n = match?.[1]?.length ?? 0;
    const next = n === 0 ? "## " : n === 1 ? "## " : n >= 4 ? "" : `${"#".repeat(n + 1)} `;
    const stripped = match ? match[0].length : 0;
    return {
        changes: [{ from, to: from + stripped, insert: next }],
        anchor: Math.max(from + next.length, head - stripped + next.length),
    };
}
// A numbered reference at the selection and its definition at the end, with the cursor in the
// definition, the part still to write. The number is one past the highest in the text (the
// site counted every match, so its second footnote was numbered 3).
export function footnoteEdit(doc, from, to) {
    const used = [...doc.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
    const n = (used.length ? Math.max(...used) : 0) + 1;
    const ref = `[^${n}]`;
    const def = `\n\n${ref}: `;
    return {
        changes: [
            { from, to, insert: ref },
            { from: doc.length, insert: def },
        ],
        // After both changes: the reference lengthens the text before the definition.
        anchor: doc.length - (to - from) + ref.length + def.length,
    };
}
// A block of text at the cursor, set apart by a blank line before it unless the cursor is on
// one, and after it when text follows on the same line.
export function blockEdit(doc, from, to, text, cursor) {
    const line = lineBounds(doc, from);
    const onBlank = line.from === from && doc.slice(line.from, line.to).trim() === "";
    const prefix = onBlank ? "" : "\n\n";
    const next = doc.charAt(to);
    const suffix = next !== "" && next !== "\n" ? "\n\n" : "";
    return {
        changes: [{ from, to, insert: `${prefix}${text}${suffix}` }],
        anchor: from + prefix.length + (cursor ?? text.length),
    };
}
// The slash line becomes the block, in its place.
export function slashBlockEdit(lineFrom, lineTo, text, cursor) {
    return { changes: [{ from: lineFrom, to: lineTo, insert: text }], anchor: lineFrom + (cursor ?? text.length) };
}
export function scaffoldCursor(s) {
    if (s.cursorAfter) {
        const at = s.text.indexOf(s.cursorAfter);
        if (at >= 0)
            return at + s.cursorAfter.length;
    }
    return s.cursor;
}
// A link at the selection, the cursor after it: the next keystroke is almost always the
// sentence going on.
export function linkEdit(from, to, selected, href, fallbackLabel) {
    const markdown = `[${selected || fallbackLabel || href}](${href})`;
    return { changes: [{ from, to, insert: markdown }], anchor: from + markdown.length };
}
// The markdown for an image when the app does not say: alt text with its brackets made safe. The
// picker asks for alt text or decorative, so an empty alt is a decorative pick: Prelum reads
// ![""](x) as decorative and refuses ![](x) as missing.
export function defaultImageMarkdown({ url, alt }) {
    const text = alt.replace(/[[\]\n]/g, " ").replace(/\s+/g, " ").trim();
    return `![${text || '""'}](${url})`;
}
