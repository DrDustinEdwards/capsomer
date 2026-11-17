// Tracked changes on prosemirror-suggest-changes (MIT, Handle with Care Collective):
// in suggesting mode a person's typing becomes an insertion mark and their deletions a deletion mark,
// and each change is accepted or rejected on its own, as in Word and Google Docs.
//
// What this adds to the library:
// - Who. Every mark says who made it (`by`, a person's id), in which revision round, and when. The
//   library joins a new change onto a mark it touches, which is right for one writer and wrong for
//   several, so `stamp` gives back each touched run its earlier owner and gives the writer's own runs
//   ids of their own (`${clientID}:n`): one id is always one person's change.
// - Blocks over Yjs. A block suggested in or out carries its mark on the block, which Yjs does not
//   keep. `blockMarkMirror` copies it into the block's `smark` attribute and back, so it reaches
//   everyone in the room and the server.
// - Settling. A save writes the text as if every pending suggestion were rejected (`settle`), so a
//   suggestion reaches a site or the repository only once someone accepts it.
//
// No DOM here except in the plugin's decorations, which only a browser draws: the room's server runs
// `settle` and `suggestionCounts` too.
import { isSuggestChangesEnabled, revertSuggestions, suggestChanges, transformToSuggestionTransaction, } from "@handlewithcare/prosemirror-suggest-changes";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { SUGGESTION_BLOCKS } from "../rich-editor/rich-editor-schema.mjs";
// The marks a suggestion is made of; collab-editor-doc.ts finds them in a stored document.
export const SUGGESTION_TYPES = new Set([
    "insertion",
    "deletion",
    "modification",
]);
const isSuggestion = (mark) => SUGGESTION_TYPES.has(mark.type.name);
const blockSuggestions = (node) => node.marks.filter(isSuggestion);
const markJson = (marks) => marks.length ? JSON.stringify(marks.map((m) => m.toJSON())) : null;
/** A transaction that came from the room (another person, or undo through Yjs) rather than this editor. */
function fromRoom(tr) {
    const meta = tr.getMeta("y-sync$");
    return Boolean(meta?.isChangeOrigin || meta?.isUndoRedoOperation);
}
/** Puts back the block marks `smark` holds, for a document read out of Yjs. */
function restoreBlockMarks(doc) {
    let state = EditorState.create({ doc });
    const tr = state.tr;
    doc.descendants((node, pos) => {
        const held = node.attrs.smark;
        if (!held || blockSuggestions(node).length)
            return true;
        for (const mark of JSON.parse(held))
            tr.addNodeMark(pos, doc.type.schema.markFromJSON(mark));
        return true;
    });
    if (!tr.docChanged)
        return doc;
    state = state.apply(tr);
    return state.doc;
}
/**
 * The document as it stands with every pending suggestion rejected and no trace of them left: what a
 * save writes. Takes JSON (the editor's, or the room's out of Yjs) and gives JSON.
 */
export function settle(schema, json) {
    let state = EditorState.create({ doc: restoreBlockMarks(schema.nodeFromJSON(json)) });
    revertSuggestions(state, (tr) => {
        state = state.apply(tr);
    });
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
        if (node.attrs.smark)
            tr.setNodeAttribute(pos, "smark", null);
        return true;
    });
    return (tr.docChanged ? state.apply(tr).doc : state.doc).toJSON();
}
/** How many characters (and whole blocks) each person has suggested, by person id. */
export function suggestionCounts(schema, json) {
    const counts = new Map();
    const add = (by, n) => counts.set(String(by), (counts.get(String(by)) ?? 0) + n);
    restoreBlockMarks(schema.nodeFromJSON(json)).descendants((node) => {
        for (const mark of node.marks)
            if (isSuggestion(mark))
                add(mark.attrs.by, node.isText ? (node.text?.length ?? 0) : 1);
        return true;
    });
    return counts;
}
/** Keeps a block's suggestion marks and its `smark` attribute the same, whichever side changed. */
function blockMarkMirror() {
    return new Plugin({
        key: new PluginKey("cap-collab-block-marks"),
        appendTransaction(trs, _old, state) {
            if (!trs.some((t) => t.docChanged))
                return null;
            // From the room, the attribute is the truth (Yjs dropped the marks); from here, the marks are.
            const remote = trs.some(fromRoom);
            const tr = state.tr;
            state.doc.descendants((node, pos) => {
                if (!SUGGESTION_BLOCKS.includes(node.type.name))
                    return true;
                const marks = blockSuggestions(node);
                const held = node.attrs.smark ?? null;
                if (remote) {
                    const want = held ? JSON.parse(held) : [];
                    if (markJson(marks) === (want.length ? JSON.stringify(want) : null))
                        return true;
                    for (const m of marks)
                        tr.removeNodeMark(pos, m);
                    for (const m of want)
                        tr.addNodeMark(pos, state.schema.markFromJSON(m));
                }
                else if (markJson(marks) !== held) {
                    tr.setNodeAttribute(pos, "smark", markJson(marks));
                }
                return true;
            });
            if (!tr.docChanged)
                return null;
            return tr.setMeta("addToHistory", false);
        },
    });
}
/** An id that is this writer's alone. */
function idMaker(s) {
    let n = 0;
    return () => `${s.clientId}:${Date.now().toString(36)}${(n++).toString(36)}`;
}
const ownId = (s, id) => typeof id === "string" && id.startsWith(`${s.clientId}:`);
/**
 * Gives every suggestion run the library just made or touched its rightful owner: content this
 * transaction put in, or newly marked for deletion, is the writer's, under an id of the writer's own;
 * a run that was already someone's suggestion gets its earlier mark back exactly.
 */
function stamp(tracked, before, s, nextId) {
    const back = tracked.mapping.invert();
    const at = new Date().toISOString();
    const doc = tracked.doc;
    const fixes = [];
    let fresh = null;
    const mine = (mark) => {
        const id = ownId(s, mark.attrs.id) ? mark.attrs.id : (fresh ??= nextId());
        return mark.type.create({ ...mark.attrs, id, by: s.by, round: s.round(), at });
    };
    /** The same kind of suggestion that sat at this place before the transaction, if any. */
    const earlier = (pos, mark) => {
        const result = back.mapResult(pos, 1);
        if (result.deletedAfter)
            return null; // Put in by this transaction.
        const old = before.nodeAt(result.pos);
        return old?.marks.find((m) => m.type === mark.type && m.attrs.by != null) ?? null;
    };
    doc.descendants((node, pos) => {
        for (const mark of node.marks) {
            if (!isSuggestion(mark) || mark.attrs.by != null)
                continue;
            const was = earlier(pos, mark);
            fixes.push({
                from: pos,
                to: pos + node.nodeSize,
                node: !node.isInline,
                old: mark,
                next: was ?? mine(mark),
            });
        }
        return true;
    });
    for (const f of fixes) {
        if (f.node)
            tracked.removeNodeMark(f.from, f.old).addNodeMark(f.from, f.next);
        else
            tracked.removeMark(f.from, f.to, f.old).addMark(f.from, f.to, f.next);
    }
    return tracked;
}
/**
 * The dispatch step for suggesting: a transaction from this editor becomes the suggestion of it,
 * owned and dated. One from the room, or from undo, passes as it is, as does any while suggesting is off.
 */
export function suggestingDispatch(s) {
    const nextId = idMaker(s);
    return (state, tr) => {
        if (!isSuggestChangesEnabled(state) ||
            !tr.docChanged ||
            fromRoom(tr) ||
            tr.getMeta("history$") ||
            tr.getMeta("cap-collab-direct"))
            return tr;
        const tracked = transformToSuggestionTransaction(tr, state, () => nextId());
        return stamp(tracked, state.doc, s, nextId);
    };
}
/** The library's plugin (on or off, the decorations, the arrow keys over its markers) and the mirror. */
export function suggestionPlugins() {
    return [suggestChanges(), blockMarkMirror()];
}
/** Every pending change in the document, in reading order. */
export function listSuggestions(doc) {
    const out = new Map();
    doc.descendants((node, pos) => {
        for (const mark of node.marks) {
            if (!isSuggestion(mark))
                continue;
            const id = String(mark.attrs.id);
            const by = String(mark.attrs.by ?? "");
            const key = `${id}|${by}`;
            const s = out.get(key) ?? {
                key,
                id,
                by,
                round: mark.attrs.round ?? null,
                at: mark.attrs.at ?? null,
                inserted: "",
                deleted: "",
                formatting: false,
                from: pos,
                to: pos,
            };
            const text = node.isText
                ? (node.text ?? "").replace(/\u200b/g, "")
                : node.isBlock
                    ? (s.inserted || s.deleted ? "\n" : "") + node.textContent
                    : "";
            if (mark.type.name === "insertion")
                s.inserted += text;
            else if (mark.type.name === "deletion")
                s.deleted += text;
            else
                s.formatting = true;
            s.from = Math.min(s.from, pos);
            s.to = Math.max(s.to, pos + node.nodeSize);
            out.set(key, s);
        }
        return true;
    });
    return [...out.values()].sort((a, b) => a.from - b.from);
}
