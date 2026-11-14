import { type ReactNode, type RefObject } from "react";
export { useConfigForm, useEditor, type Editing } from "./config-editor.react.tsx";
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
