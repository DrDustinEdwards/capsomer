// What the formatted editor adds when it is in a file's room: the other people's carets and
// selections, suggesting (tracked changes, collab-editor-suggest.ts), and the comment threads marked in
// the text. The shared document itself is Tiptap's Collaboration extension over the room's Yjs copy.
//
// A caret's name is the room's word, never the other browser's: each caret is looked up by its Yjs
// client id in the room's list of people (who the door let in), and a caret the room does not list is
// not drawn.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { absolutePositionToRelativePosition, relativePositionToAbsolutePosition, yCursorPlugin, yCursorPluginKey, ySyncPluginKey, } from "@tiptap/y-tiptap";
import * as Y from "yjs";
import { suggestingDispatch, suggestionPlugins } from "./collab-editor-suggest.js";
export function roomCarets(awareness, who) {
    return Extension.create({
        name: "collabCarets",
        addProseMirrorPlugins() {
            return [
                yCursorPlugin(awareness, {
                    awarenessStateFilter: (mine, theirs) => mine !== theirs && who()(theirs) !== null,
                    cursorBuilder: (_user, clientId) => {
                        const person = who()(clientId);
                        const caret = document.createElement("span");
                        caret.className = "cap-collab-caret";
                        caret.dataset.who = String(person.slot);
                        const label = document.createElement("span");
                        label.className = "cap-collab-caret-name";
                        label.textContent = person.name;
                        // Word joiners either side keep the caret from breaking the line it sits in.
                        caret.appendChild(document.createTextNode("\u2060"));
                        caret.appendChild(label);
                        caret.appendChild(document.createTextNode("\u2060"));
                        return caret;
                    },
                    selectionBuilder: (_user, clientId) => ({
                        class: "cap-collab-caret-selection",
                        "data-who": String(who()(clientId)?.slot ?? 0),
                    }),
                }),
            ];
        },
    });
}
/** Draws the carets again, after the room's list of people changed. */
export function refreshCarets(state) {
    return state.tr.setMeta(yCursorPluginKey, { awarenessUpdated: true });
}
/** Suggesting: each change this editor makes becomes a suggestion of the person's, while it is on. */
export function suggesting(suggester) {
    const dispatch = suggestingDispatch(suggester);
    return Extension.create({
        name: "collabSuggesting",
        addProseMirrorPlugins() {
            return suggestionPlugins();
        },
        dispatchTransaction({ transaction, next }) {
            next(dispatch(this.editor.state, transaction));
        },
    });
}
export const commentsKey = new PluginKey("cap-collab-comments");
/** Where a selection sits in the shared copy, so it stays put as people type around it. Null with no binding yet. */
export function anchorOf(state, from, to) {
    const y = ySyncPluginKey.getState(state);
    if (!y?.binding)
        return null;
    const at = (pos) => Y.relativePositionToJSON(absolutePositionToRelativePosition(pos, y.type, y.binding.mapping));
    return JSON.stringify({ from: at(from), to: at(to) });
}
/** Where a thread's text is now, or null when that text is gone. */
export function rangeOf(state, anchor) {
    const y = ySyncPluginKey.getState(state);
    if (!anchor || !y?.binding)
        return null;
    try {
        const range = JSON.parse(anchor);
        const from = relativePositionToAbsolutePosition(y.doc, y.type, Y.createRelativePositionFromJSON(range.from), y.binding.mapping);
        const to = relativePositionToAbsolutePosition(y.doc, y.type, Y.createRelativePositionFromJSON(range.to), y.binding.mapping);
        return from !== null && to !== null && from < to ? { from, to } : null;
    }
    catch {
        return null;
    }
}
/** Marks each open thread's text; the one open in the panel is marked more strongly. A click on a mark opens its thread. */
export function commentMarks(get, onClick) {
    const build = (state) => {
        const { threads, active } = get();
        const marks = [];
        for (const t of threads) {
            const range = rangeOf(state, t.anchor);
            if (range)
                marks.push(Decoration.inline(range.from, range.to, {
                    class: "cap-collab-mark",
                    "data-comment": t.id,
                    ...(t.id === active ? { "data-active": "" } : {}),
                }));
        }
        return DecorationSet.create(state.doc, marks);
    };
    return Extension.create({
        name: "collabComments",
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    key: commentsKey,
                    state: {
                        init: (_config, state) => build(state),
                        apply: (tr, old, _before, state) => tr.docChanged || tr.getMeta(commentsKey) || tr.getMeta(ySyncPluginKey)
                            ? build(state)
                            : old.map(tr.mapping, tr.doc),
                    },
                    props: {
                        decorations: (state) => commentsKey.getState(state),
                        handleClick: (_view, _pos, event) => {
                            const mark = event.target?.closest?.("[data-comment]");
                            if (mark)
                                onClick(mark.getAttribute("data-comment"));
                            return false;
                        },
                    },
                }),
            ];
        },
    });
}
