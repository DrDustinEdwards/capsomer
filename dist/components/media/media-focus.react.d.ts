import { type ReactNode } from "react";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function focusWords(focus: string | null | undefined): string;
export declare function MediaFocus({ name, src, focus, action, Form, ident, base, }: {
    name: string;
    src: string;
    focus: string | null | undefined;
    action: string;
    Form: FormComponent;
    ident: ReactNode;
    base: string;
}): import("react").JSX.Element;
