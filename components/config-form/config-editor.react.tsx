import { useId, useRef, useState, type RefObject } from "react";

// The editor's state and the form's ids, apart from ConfigForm: a list view that only opens
// and closes editors (useEditor) loads this module alone, without the form's Button, Alert and
// Panel, which belong to the lazily loaded form.

// What a list's editor holds: adding a new one, or editing one row. `key` names the row, so the
// form is keyed on what it edits and switching rows starts a fresh draft.
export type Editing<Row> = { kind: "add" } | { kind: "edit"; row: Row; key: string };

export function useEditor<Row>(onClose?: () => void): {
  editing: Editing<Row> | null;
  add: () => void;
  edit: (row: Row, key: string) => void;
  close: () => void;
  formKey: string;
  isEditing: (key: string) => boolean;
} {
  const [editing, setEditing] = useState<Editing<Row> | null>(null);
  return {
    editing,
    add: () => setEditing({ kind: "add" }),
    edit: (row, key) => setEditing({ kind: "edit", row, key }),
    close: () => {
      setEditing(null);
      onClose?.();
    },
    formKey: editing ? (editing.kind === "add" ? "add" : `edit:${editing.key}`) : "",
    isEditing: (key) => editing?.kind === "edit" && editing.key === key,
  };
}

export function useConfigForm(): {
  f: (k: string) => string;
  first: RefObject<HTMLInputElement | null>;
} {
  const id = useId();
  const first = useRef<HTMLInputElement>(null);
  return { f: (k) => `${id}-${k}`, first };
}
