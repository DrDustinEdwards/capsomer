import { type ReactNode, type RefObject } from "react";
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
export interface ConfigFormProps {
    f: (k: string) => string;
    first: RefObject<HTMLInputElement | null>;
    title: string;
    src?: ReactNode;
    hint: string | null;
    onSubmit: () => void;
    onClose: () => void;
    submitLabel?: string;
    danger?: ReactNode;
    children: ReactNode;
}
export declare function ConfigForm({ f, first, title, src, hint, onSubmit, onClose, submitLabel, danger, children, }: ConfigFormProps): import("react").JSX.Element;
