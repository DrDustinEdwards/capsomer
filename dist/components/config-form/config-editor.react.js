import { useId, useRef, useState } from "react";
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
export function useConfigForm() {
    const id = useId();
    const first = useRef(null);
    return { f: (k) => `${id}-${k}`, first };
}
