import { type ComponentType, type FormHTMLAttributes, type ReactNode } from "react";
export declare function focusWords(focus: string | null | undefined): string;
export declare function MediaFocus({ name, src, focus, action, Form, ident, base, }: {
    name: string;
    src: string;
    focus: string | null | undefined;
    action: string;
    Form: ComponentType<FormHTMLAttributes<HTMLFormElement> & {
        method?: "get" | "post";
    }>;
    ident: ReactNode;
    base: string;
}): import("react").JSX.Element;
