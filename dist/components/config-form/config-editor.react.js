import { useId, useRef, useState } from "react";
// The add-and-edit state of a list of settings (sites, packages, projects): which form is open,
// and a key for it. One editor per list; opening one closes the other.
export function useEditor(onClose) {
    const [editing, setEditing] = useState(null);
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
export function useConfigForm() {
    const id = useId();
    const first = useRef(null);
    return { f: (k) => `${id}-${k}`, first };
}
