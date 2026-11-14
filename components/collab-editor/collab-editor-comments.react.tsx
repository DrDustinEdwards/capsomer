// The comment threads on a file in its room: a thread sits on a passage of the text, which is marked in
// the editor and stays put as people type around it. Everyone in the room comments and replies; the
// writer or someone who edits resolves a thread; the writer, or a viewer who `deletesAny`, deletes a
// comment. The app's room server keeps them and tells everyone at once.

import type { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button.react.tsx";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { Time } from "../time/time.react.tsx";

import type { ClientMessage, RoomComment, RoomViewer } from "./collab-editor-protocol.ts";

import { anchorOf, rangeOf } from "./collab-editor-extensions.ts";

type Send = (message: Exclude<ClientMessage, { t: "flush" }>) => void;

type Thread = { head: RoomComment; replies: RoomComment[] };

function threadsOf(comments: RoomComment[]): Thread[] {
  const heads = comments.filter((c) => !c.parentId);
  return heads.map((head) => ({ head, replies: comments.filter((c) => c.parentId === head.id) }));
}

function Reply({ onSend, label }: { onSend: (body: string) => void; label: string }) {
  const [body, setBody] = useState("");
  return (
    <form
      className="cap-collab-comment-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        onSend(body.trim());
        setBody("");
      }}
    >
      <textarea
        className="cap-input"
        rows={2}
        aria-label={label}
        placeholder={label}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        size="sm"
        type="submit"
        disabledReason={body.trim() ? undefined : "Write something first"}
      >
        Send
      </Button>
    </form>
  );
}

function Comment({
  c,
  me,
  send,
  canDelete,
}: {
  c: RoomComment;
  me: RoomViewer;
  send: Send;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(c.body);
  const [deleting, setDeleting] = useState(false);
  return (
    <li className="cap-collab-comment">
      <p className="cap-collab-comment-meta">
        <strong>{c.name}</strong> <Time at={c.createdAt} />
        {c.editedAt ? <span className="cap-collab-note"> (edited)</span> : null}
      </p>
      {editing ? (
        <form
          className="cap-collab-comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            send({ t: "comment-edit", id: c.id, body: body.trim() });
            setEditing(false);
          }}
        >
          <textarea
            className="cap-input"
            rows={3}
            aria-label="Your comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="cap-collab-actions">
            <Button size="sm" type="submit">
              Save
            </Button>
            <Button size="sm" variant="quiet" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="cap-collab-comment-body">{c.body}</p>
      )}
      {!editing && (c.personId === me.id || canDelete) ? (
        <div className="cap-collab-actions">
          {c.personId === me.id ? (
            <Button
              size="xs"
              variant="quiet"
              onClick={() => {
                // From the comment as it is now: a collaborator may have changed it since.
                setBody(c.body);
                setEditing(true);
              }}
            >
              Edit
            </Button>
          ) : null}
          <Button size="xs" variant="quiet" onClick={() => setDeleting(true)}>
            Delete
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        open={deleting}
        title="Delete this comment?"
        body={[`${c.name}'s comment is removed for everyone in the room.`]}
        action="Delete comment"
        perform={async () => send({ t: "comment-delete", id: c.id })}
        onClose={() => setDeleting(false)}
      />
    </li>
  );
}

export function CommentsPanel({
  comments,
  me,
  send,
  editor,
  active,
  onActive,
  id = "comments",
}: {
  /** The panel's id, unique on the page. */
  id?: string;
  comments: RoomComment[];
  me: RoomViewer;
  send: Send;
  editor: Editor | null;
  active: string | null;
  onActive: (id: string | null) => void;
}) {
  const threads = threadsOf(comments);
  const open = threads.filter((t) => !t.head.resolvedAt);
  const resolved = threads.filter((t) => t.head.resolvedAt);
  const [selection, setSelection] = useState<{ from: number; to: number; quote: string } | null>(
    null,
  );
  const [writing, setWriting] = useState<{ from: number; to: number; quote: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  // Positions move as people type: a render after any change reads each thread's place again.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const read = () => {
      const { from, to, empty } = editor.state.selection;
      setSelection(
        empty
          ? null
          : { from, to, quote: editor.state.doc.textBetween(from, to, " ").slice(0, 500) },
      );
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
      list.current?.querySelector<HTMLElement>(`[data-thread="${CSS.escape(active)}"]`)?.focus();
  }, [active]);

  const show = (t: Thread) => {
    onActive(t.head.id);
    const range = editor ? rangeOf(editor.state, t.head.anchor) : null;
    if (editor && range) editor.chain().focus().setTextSelection(range).scrollIntoView().run();
  };
  const mayResolve = (t: Thread) => t.head.personId === me.id || me.access === "edit";
  const canDelete = me.deletesAny === true;

  const renderThread = (t: Thread) => {
    const gone =
      Boolean(t.head.anchor) && editor !== null && rangeOf(editor.state, t.head.anchor) === null;
    return (
      <article
        key={t.head.id}
        className="cap-collab-thread"
        data-thread={t.head.id}
        data-active={t.head.id === active ? "" : undefined}
        tabIndex={-1}
        aria-label={`Comment by ${t.head.name}`}
      >
        {t.head.quote ? (
          <blockquote className="cap-collab-thread-quote">
            {gone ? <span className="cap-collab-note">The text this was on is gone: </span> : null}
            {t.head.quote}
          </blockquote>
        ) : null}
        <ul className="cap-collab-thread-comments">
          {[t.head, ...t.replies].map((c) => (
            <Comment key={c.id} c={c} me={me} send={send} canDelete={canDelete} />
          ))}
        </ul>
        <div className="cap-collab-actions">
          {!gone && t.head.anchor ? (
            <Button size="xs" variant="quiet" onClick={() => show(t)}>
              Show in the text
            </Button>
          ) : null}
          {mayResolve(t) ? (
            <Button
              size="xs"
              variant="quiet"
              onClick={() =>
                send({ t: "comment-resolve", id: t.head.id, resolved: !t.head.resolvedAt })
              }
            >
              {t.head.resolvedAt ? "Reopen" : "Resolve"}
            </Button>
          ) : null}
        </div>
        {!t.head.resolvedAt ? (
          <Reply
            label="Reply"
            onSend={(body) =>
              send({ t: "comment", body, anchor: null, quote: "", parentId: t.head.id })
            }
          />
        ) : null}
      </article>
    );
  };

  return (
    <Panel
      title="Comments"
      count={open.length}
      src="Everyone in this file sees them at once"
      id={id}
    >
      <div className="cap-collab-stack" ref={list}>
        {writing ? (
          <div className="cap-collab-thread" data-new="">
            <blockquote className="cap-collab-thread-quote">{writing.quote}</blockquote>
            <Reply
              label="Your comment"
              onSend={(body) => {
                if (!editor) return;
                send({
                  t: "comment",
                  body,
                  anchor: anchorOf(editor.state, writing.from, writing.to),
                  quote: writing.quote,
                });
                setWriting(null);
              }}
            />
            <Button size="sm" variant="quiet" onClick={() => setWriting(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setWriting(selection)}
            disabledReason={selection ? undefined : "Select the text the comment is about"}
          >
            Comment on the selection
          </Button>
        )}
        {open.length === 0 && !writing ? (
          <p className="cap-collab-note">No open comments.</p>
        ) : (
          open.map(renderThread)
        )}
        {resolved.length > 0 ? (
          <details className="cap-collab-resolved">
            <summary>{resolved.length} resolved</summary>
            {resolved.map(renderThread)}
          </details>
        ) : null}
      </div>
    </Panel>
  );
}
