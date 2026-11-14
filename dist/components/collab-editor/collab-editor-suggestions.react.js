import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// The tracked changes waiting in a file: each person's suggestions in reading order,
// with who made them, in which round, and Accept or Reject on each, on a round, or on all. Someone who
// may only suggest sees the same list and withdraws their own. A save leaves every pending suggestion
// out (collab-editor-suggest.ts `settle`), so a suggestion reaches a site or Git only once accepted.
import { applySuggestion, applySuggestions, revertSuggestion, revertSuggestions, } from "@handlewithcare/prosemirror-suggest-changes";
import { useEffect, useState } from "react";
import { Button } from "../button/button.react.js";
import { Field } from "../field/field.react.js";
import { Panel } from "../panel/panel.react.js";
import { Select } from "../select/select.react.js";
import { Time } from "../time/time.react.js";
import { listSuggestions } from "./collab-editor-suggest.js";
/** Runs a library command as a change of its own, not turned into a suggestion of one. */
function direct(editor, command) {
    command(editor.state, (tr) => editor.view.dispatch(tr.setMeta("cap-collab-direct", true)));
}
function clip(text, n = 120) {
    const t = text.replace(/\s+/g, " ").trim();
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
export function SuggestionsPanel({ editor, names, me, mayDecide, round, onRound, id = "suggestions", }) {
    const [list, setList] = useState([]);
    const [shown, setShown] = useState("all");
    useEffect(() => {
        if (!editor)
            return;
        const read = () => setList(listSuggestions(editor.state.doc));
        read();
        editor.on("update", read);
        return () => {
            editor.off("update", read);
        };
    }, [editor]);
    const rounds = [...new Set(list.map((s) => s.round).filter((r) => Boolean(r)))];
    const visible = shown === "all"
        ? list
        : list.filter((s) => (s.round ?? "") === (shown === "none" ? "" : shown));
    const who = (s) => s.by === String(me) ? "You" : (names[s.by] ?? "Someone no longer on this project");
    const each = (fn, items) => {
        if (!editor)
            return;
        for (const s of items)
            direct(editor, fn(s.id));
    };
    const all = shown === "all";
    // Which change a row's button acts on, for a screen reader: "Accept Ana's change".
    const whose = (s) => (_jsxs("span", { className: "cap-sr-only", children: [" ", s.by === String(me) ? "your" : `${who(s)}'s`, " change"] }));
    return (_jsx(Panel, { title: "Suggestions", count: list.length, src: "Saved to the site or Git only once accepted", id: id, children: _jsxs("div", { className: "cap-collab-stack", children: [_jsx(Field, { label: "Revision round for your suggestions", help: "Optional. Each suggestion you make from now on carries it, so a round can be accepted at once.", children: _jsx("input", { id: `${id}-round`, className: "cap-input", placeholder: "For example, Second draft", value: round, maxLength: 60, onChange: (e) => onRound(e.target.value) }) }), list.length === 0 ? (_jsx("p", { className: "cap-collab-note", children: "No suggestions are waiting." })) : (_jsxs(_Fragment, { children: [rounds.length > 0 ? (_jsx(Field, { label: "Show", children: _jsx(Select, { id: `${id}-show`, size: "sm", value: shown, onChange: (e) => setShown(e.target.value), options: [
                                    { value: "all", label: "Every round" },
                                    ...rounds.map((r) => ({ value: r, label: r })),
                                    { value: "none", label: "No round" },
                                ] }) })) : null, mayDecide ? (_jsxs("div", { className: "cap-collab-actions", children: [_jsx(Button, { size: "sm", onClick: () => all
                                        ? editor && direct(editor, applySuggestions)
                                        : each(applySuggestion, visible), children: all ? "Accept all" : "Accept this round" }), _jsx(Button, { size: "sm", variant: "quiet", onClick: () => all
                                        ? editor && direct(editor, revertSuggestions)
                                        : each(revertSuggestion, visible), children: all ? "Reject all" : "Reject this round" })] })) : null, _jsx("ol", { className: "cap-collab-suggestions", children: visible.map((s) => (_jsxs("li", { className: "cap-collab-suggestion", children: [_jsxs("p", { className: "cap-collab-comment-meta", children: [_jsx("strong", { children: who(s) }), " ", s.at ? _jsx(Time, { at: s.at }) : null, s.round ? _jsxs("span", { className: "cap-collab-note", children: [" \u00B7 ", s.round] }) : null] }), _jsxs("p", { className: "cap-collab-suggestion-text", children: [s.deleted ? (_jsxs("del", { children: [_jsx("span", { className: "cap-sr-only", children: "Take out: " }), clip(s.deleted)] })) : null, s.deleted && s.inserted ? " " : null, s.inserted ? (_jsxs("ins", { children: [_jsx("span", { className: "cap-sr-only", children: "Put in: " }), clip(s.inserted)] })) : null, s.formatting && !s.inserted && !s.deleted ? (_jsx("span", { children: "Formatting changed" })) : null] }), _jsxs("div", { className: "cap-collab-actions", children: [_jsxs(Button, { size: "xs", variant: "quiet", onClick: () => editor
                                                    ?.chain()
                                                    .focus()
                                                    .setTextSelection({ from: s.from, to: s.to })
                                                    .scrollIntoView()
                                                    .run(), children: ["Show", whose(s)] }), mayDecide ? (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "xs", onClick: () => editor && direct(editor, applySuggestion(s.id)), children: ["Accept", whose(s)] }), _jsxs(Button, { size: "xs", variant: "quiet", onClick: () => editor && direct(editor, revertSuggestion(s.id)), children: ["Reject", whose(s)] })] })) : s.by === String(me) ? (_jsxs(Button, { size: "xs", variant: "quiet", onClick: () => editor && direct(editor, revertSuggestion(s.id)), children: ["Withdraw", whose(s)] })) : null] })] }, s.key))) })] }))] }) }));
}
