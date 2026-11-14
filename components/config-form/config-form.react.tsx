import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { Panel } from "../panel/panel.react.tsx";

// What a list's editor holds: adding a new one, or editing one row. `key` names the row, so the
// form is keyed on what it edits and switching rows starts a fresh draft.
export type Editing<Row> = { kind: "add" } | { kind: "edit"; row: Row; key: string };

// The add-and-edit state of a list of settings (sites, packages, projects): which form is open,
// and a key for it. One editor per list; opening one closes the other.
export function useEditor<Row>(onClose?: () => void): {
  editing: Editing<Row> | null;
  add: () => void;
  edit: (row: Row, key: string) => void;
  close: () => void;
  // Give it to the form as its React key: "add", "edit:<key>", or "" when nothing is open.
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

// The form's ids and its first field, which takes focus when the form opens.
export function useConfigForm(): {
  f: (k: string) => string;
  first: RefObject<HTMLInputElement | null>;
} {
  const id = useId();
  const first = useRef<HTMLInputElement>(null);
  return { f: (k) => `${id}-${k}`, first };
}

export interface ConfigFormProps {
  f: (k: string) => string;
  first: RefObject<HTMLInputElement | null>;
  title: string;
  // Where the setting lives: "Saved in D1".
  src?: ReactNode;
  // Why the draft cannot be sent yet ("A name is needed"), shown above the buttons and announced.
  hint: string | null;
  onSubmit: () => void;
  onClose: () => void;
  // The submit's words. "Preview" by default: it opens a confirm that shows what will change,
  // and changes nothing itself.
  submitLabel?: string;
  // A Danger area under the buttons (Remove this site), apart from the form's own actions.
  danger?: ReactNode;
  children: ReactNode;
}

// The one shell of an operator's add and edit forms: a panel that scrolls into view and puts focus
// in its first field when it opens and hands focus back to its opener when it closes, the fields
// in a grid, a hint while the draft is not sendable, the submit and Cancel, and an optional Danger
// area. Esc in a field cancels.
export function ConfigForm({
  f,
  first,
  title,
  src,
  hint,
  onSubmit,
  onClose,
  submitLabel = "Preview",
  danger,
  children,
}: ConfigFormProps) {
  const box = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  // The control that opened the form (Add, Edit) gets focus back when the form closes by Cancel,
  // Esc or a save, if focus was lost with the form; a control that has gone keeps nothing.
  // Read while rendering, before the form's own focus and before an app disables its Add button.
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  useEffect(() => {
    return () => {
      requestAnimationFrame(() => {
        const now = document.activeElement;
        const lost = !now || now === document.body || !now.isConnected;
        if (lost && opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, [opener]);
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest" });
    first.current?.focus();
  }, [first]);
  // Esc in any field cancels, as Cancel does.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const el = form.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      close.current();
    };
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Panel title={title} src={src} headingId={f("h")} ref={box} className="cap-config">
      <form
        ref={form}
        className="cap-fields cap-config-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
        {hint && (
          <div className="cap-config-full">
            <Alert tone="warn">{hint}</Alert>
          </div>
        )}
        <div className="cap-config-actions cap-config-full">
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
        {danger != null && <div className="cap-config-danger cap-config-full">{danger}</div>}
      </form>
    </Panel>
  );
}
