import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button.react.js";
import { Panel } from "../panel/panel.react.js";
import { Time } from "../time/time.react.js";
import { anchorOf, rangeOf } from "./collab-editor-extensions.js";
function threadsOf(comments) {
    const heads = comments.filter((c) => !c.parentId);
    return heads.map((head) => ({ head, replies: comments.filter((c) => c.parentId === head.id) }));
}
function Reply({ onSend, label }) {
    const [body, setBody] = useState("");
    return (_jsxs("form", { className: "cap-collab-comment-form", onSubmit: (e) => {
            e.preventDefault();
            if (!body.trim())
                return;
            onSend(body.trim());
            setBody("");
        }, children: [_jsx("textarea", { className: "cap-input", rows: 2, "aria-label": label, placeholder: label, value: body, onChange: (e) => setBody(e.target.value) }), _jsx(Button, { size: "sm", type: "submit", disabledReason: body.trim() ? undefined : "Write something first", children: "Send" })] }));
}
function Comment({ c, me, send, canDelete, }) {
    const [editing, setEditing] = useState(false);
    const [body, setBody] = useState(c.body);
    return (_jsxs("li", { className: "cap-collab-comment", children: [_jsxs("p", { className: "cap-collab-comment-meta", children: [_jsx("strong", { children: c.name }), " ", _jsx(Time, { at: c.createdAt }), c.editedAt ? _jsx("span", { className: "cap-collab-note", children: " (edited)" }) : null] }), editing ? (_jsxs("form", { className: "cap-collab-comment-form", onSubmit: (e) => {
                    e.preventDefault();
                    if (!body.trim())
                        return;
                    send({ t: "comment-edit", id: c.id, body: body.trim() });
                    setEditing(false);
                }, children: [_jsx("textarea", { className: "cap-input", rows: 3, "aria-label": "Your comment", value: body, onChange: (e) => setBody(e.target.value) }), _jsxs("div", { className: "cap-collab-actions", children: [_jsx(Button, { size: "sm", type: "submit", children: "Save" }), _jsx(Button, { size: "sm", variant: "quiet", onClick: () => setEditing(false), children: "Cancel" })] })] })) : (_jsx("p", { className: "cap-collab-comment-body", children: c.body })), !editing && (c.personId === me.id || canDelete) ? (_jsxs("div", { className: "cap-collab-actions", children: [c.personId === me.id ? (_jsx(Button, { size: "xs", variant: "quiet", onClick: () => setEditing(true), children: "Edit" })) : null, _jsx(Button, { size: "xs", variant: "quiet", onClick: () => send({ t: "comment-delete", id: c.id }), children: "Delete" })] })) : null] }));
}
export function CommentsPanel({ comments, me, send, editor, active, onActive, id = "comments", }) {
    const threads = threadsOf(comments);
    const open = threads.filter((t) => !t.head.resolvedAt);
    const resolved = threads.filter((t) => t.head.resolvedAt);
    const [selection, setSelection] = useState(null);
    const [writing, setWriting] = useState(null);
    const list = useRef(null);
    // Positions move as people type: a render after any change reads each thread's place again.
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!editor)
            return;
        const read = () => {
            const { from, to, empty } = editor.state.selection;
            setSelection(empty
                ? null
                : { from, to, quote: editor.state.doc.textBetween(from, to, " ").slice(0, 500) });
            setTick((t) => t + 1);
        };
        editor.on("selectionUpdate", read);
        editor.on("update", read);
        return () => {
            editor.off("selectionUpdate", read);
            editor.off("update", read);
        };
    }, [editor]);
    // A thread chosen in the text opens here.
    useEffect(() => {
        if (active)
            list.current?.querySelector(`[data-thread="${CSS.escape(active)}"]`)?.focus();
    }, [active]);
    const show = (t) => {
        onActive(t.head.id);
        const range = editor ? rangeOf(editor.state, t.head.anchor) : null;
        if (editor && range)
            editor.chain().focus().setTextSelection(range).scrollIntoView().run();
    };
    const mayResolve = (t) => t.head.personId === me.id || me.access === "edit";
    const canDelete = me.deletesAny === true;
    const renderThread = (t) => {
        const gone = Boolean(t.head.anchor) && editor !== null && rangeOf(editor.state, t.head.anchor) === null;
        return (_jsxs("article", { className: "cap-collab-thread", "data-thread": t.head.id, "data-active": t.head.id === active ? "" : undefined, tabIndex: -1, "aria-label": `Comment by ${t.head.name}`, children: [t.head.quote ? (_jsxs("blockquote", { className: "cap-collab-thread-quote", children: [gone ? _jsx("span", { className: "cap-collab-note", children: "The text this was on is gone: " }) : null, t.head.quote] })) : null, _jsx("ul", { className: "cap-collab-thread-comments", children: [t.head, ...t.replies].map((c) => (_jsx(Comment, { c: c, me: me, send: send, canDelete: canDelete }, c.id))) }), _jsxs("div", { className: "cap-collab-actions", children: [!gone && t.head.anchor ? (_jsx(Button, { size: "xs", variant: "quiet", onClick: () => show(t), children: "Show in the text" })) : null, mayResolve(t) ? (_jsx(Button, { size: "xs", variant: "quiet", onClick: () => send({ t: "comment-resolve", id: t.head.id, resolved: !t.head.resolvedAt }), children: t.head.resolvedAt ? "Reopen" : "Resolve" })) : null] }), !t.head.resolvedAt ? (_jsx(Reply, { label: "Reply", onSend: (body) => send({ t: "comment", body, anchor: null, quote: "", parentId: t.head.id }) })) : null] }, t.head.id));
    };
    return (_jsx(Panel, { title: "Comments", count: open.length, src: "Everyone in this file sees them at once", id: id, children: _jsxs("div", { className: "cap-collab-stack", ref: list, children: [writing ? (_jsxs("div", { className: "cap-collab-thread", "data-new": "", children: [_jsx("blockquote", { className: "cap-collab-thread-quote", children: writing.quote }), _jsx(Reply, { label: "Your comment", onSend: (body) => {
                                if (!editor)
                                    return;
                                send({
                                    t: "comment",
                                    body,
                                    anchor: anchorOf(editor.state, writing.from, writing.to),
                                    quote: writing.quote,
                                });
                                setWriting(null);
                            } }), _jsx(Button, { size: "sm", variant: "quiet", onClick: () => setWriting(null), children: "Cancel" })] })) : (_jsx(Button, { size: "sm", onClick: () => setWriting(selection), disabledReason: selection ? undefined : "Select the text the comment is about", children: "Comment on the selection" })), open.length === 0 && !writing ? (_jsx("p", { className: "cap-collab-note", children: "No open comments." })) : (open.map(renderThread)), resolved.length > 0 ? (_jsxs("details", { className: "cap-collab-resolved", children: [_jsxs("summary", { children: [resolved.length, " resolved"] }), resolved.map(renderThread)] })) : null] }) }));
}
