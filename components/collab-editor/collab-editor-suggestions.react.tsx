// The tracked changes waiting in a file: each person's suggestions in reading order,
// with who made them, in which round, and Accept or Reject on each, on a round, or on all. Someone who
// may only suggest sees the same list and withdraws their own. A save leaves every pending suggestion
// out (collab-editor-suggest.ts `settle`), so a suggestion reaches a site or Git only once accepted.

import {
  applySuggestion,
  applySuggestions,
  revertSuggestion,
  revertSuggestions,
} from "@handlewithcare/prosemirror-suggest-changes";
import type { Editor } from "@tiptap/core";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { useEffect, useState } from "react";
import { Button } from "../button/button.react.tsx";
import { Field } from "../field/field.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { Select } from "../select/select.react.tsx";
import { Time } from "../time/time.react.tsx";

import { listSuggestions, type Suggestion } from "./collab-editor-suggest.ts";

type Command = (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/** Runs a library command as a change of its own, not turned into a suggestion of one. */
function direct(editor: Editor, command: Command) {
  command(editor.state, (tr) => editor.view.dispatch(tr.setMeta("cap-collab-direct", true)));
}

function clip(text: string, n = 120) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export function SuggestionsPanel({
  editor,
  names,
  me,
  mayDecide,
  round,
  onRound,
  id = "suggestions",
}: {
  /** The panel's id, unique on the page; its fields' ids start with it. */
  id?: string;
  editor: Editor | null;
  /** People by id, for whose a suggestion is. */
  names: Record<string, string>;
  me: number;
  /** Someone who may edit accepts and rejects; someone who suggests only withdraws their own. */
  mayDecide: boolean;
  /** The round new suggestions go in, or "" for none. */
  round: string;
  onRound: (round: string) => void;
}) {
  const [list, setList] = useState<Suggestion[]>([]);
  const [shown, setShown] = useState("all");
  useEffect(() => {
    if (!editor) return;
    const read = () => setList(listSuggestions(editor.state.doc));
    read();
    editor.on("update", read);
    return () => {
      editor.off("update", read);
    };
  }, [editor]);

  const rounds = [...new Set(list.map((s) => s.round).filter((r): r is string => Boolean(r)))];
  const visible =
    shown === "all"
      ? list
      : list.filter((s) => (s.round ?? "") === (shown === "none" ? "" : shown));
  const who = (s: Suggestion) =>
    s.by === String(me) ? "You" : (names[s.by] ?? "Someone no longer on this project");
  const each = (fn: (id: string) => Command, items: Suggestion[]) => {
    if (!editor) return;
    for (const s of items) direct(editor, fn(s.id));
  };
  const all = shown === "all";

  return (
    <Panel
      title="Suggestions"
      count={list.length}
      src="Saved to the site or Git only once accepted"
      id={id}
    >
      <div className="cap-collab-stack">
        <Field
          label="Revision round for your suggestions"
          help="Optional. Each suggestion you make from now on carries it, so a round can be accepted at once."
        >
          <input
            id={`${id}-round`}
            className="cap-input"
            placeholder="For example, Second draft"
            value={round}
            maxLength={60}
            onChange={(e) => onRound(e.target.value)}
          />
        </Field>
        {list.length === 0 ? (
          <p className="cap-collab-note">No suggestions are waiting.</p>
        ) : (
          <>
            {rounds.length > 0 ? (
              <Field label="Show">
                <Select
                  id={`${id}-show`}
                  size="sm"
                  value={shown}
                  onChange={(e) => setShown(e.target.value)}
                  options={[
                    { value: "all", label: "Every round" },
                    ...rounds.map((r) => ({ value: r, label: r })),
                    { value: "none", label: "No round" },
                  ]}
                />
              </Field>
            ) : null}
            {mayDecide ? (
              <div className="cap-collab-actions">
                <Button
                  size="sm"
                  onClick={() =>
                    all
                      ? editor && direct(editor, applySuggestions)
                      : each(applySuggestion, visible)
                  }
                >
                  {all ? "Accept all" : "Accept this round"}
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() =>
                    all
                      ? editor && direct(editor, revertSuggestions)
                      : each(revertSuggestion, visible)
                  }
                >
                  {all ? "Reject all" : "Reject this round"}
                </Button>
              </div>
            ) : null}
            <ol className="cap-collab-suggestions">
              {visible.map((s) => (
                <li key={s.key} className="cap-collab-suggestion">
                  <p className="cap-collab-comment-meta">
                    <strong>{who(s)}</strong> {s.at ? <Time at={s.at} /> : null}
                    {s.round ? <span className="cap-collab-note"> · {s.round}</span> : null}
                  </p>
                  <p className="cap-collab-suggestion-text">
                    {s.deleted ? (
                      <del>
                        <span className="cap-sr-only">Take out: </span>
                        {clip(s.deleted)}
                      </del>
                    ) : null}
                    {s.deleted && s.inserted ? " " : null}
                    {s.inserted ? (
                      <ins>
                        <span className="cap-sr-only">Put in: </span>
                        {clip(s.inserted)}
                      </ins>
                    ) : null}
                    {s.formatting && !s.inserted && !s.deleted ? (
                      <span>Formatting changed</span>
                    ) : null}
                  </p>
                  <div className="cap-collab-actions">
                    <Button
                      size="xs"
                      variant="quiet"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .setTextSelection({ from: s.from, to: s.to })
                          .scrollIntoView()
                          .run()
                      }
                    >
                      Show
                    </Button>
                    {mayDecide ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() => editor && direct(editor, applySuggestion(s.id))}
                        >
                          Accept
                        </Button>
                        <Button
                          size="xs"
                          variant="quiet"
                          onClick={() => editor && direct(editor, revertSuggestion(s.id))}
                        >
                          Reject
                        </Button>
                      </>
                    ) : s.by === String(me) ? (
                      <Button
                        size="xs"
                        variant="quiet"
                        onClick={() => editor && direct(editor, revertSuggestion(s.id))}
                      >
                        Withdraw
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </Panel>
  );
}
