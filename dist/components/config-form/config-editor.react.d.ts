import { type RefObject } from "react";
export type Editing<Row> = {
    kind: "add";
} | {
    kind: "edit";
    row: Row;
    key: string;
};
export declare function useEditor<Row>(onClose?: () => void): {
    editing: Editing<Row> | null;
    add: () => void;
    edit: (row: Row, key: string) => void;
    close: () => void;
    formKey: string;
    isEditing: (key: string) => boolean;
};
export declare function useConfigForm(): {
    f: (k: string) => string;
    first: RefObject<HTMLInputElement | null>;
};
