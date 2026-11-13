import { type FormHTMLAttributes, type ReactNode, type Ref } from "react";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
export type { FormComponent };
export declare function ReadOnlyForm({ readOnly, message, form, onSubmit, className, children, ref, ...rest }: Omit<FormHTMLAttributes<HTMLFormElement>, "style" | "action" | "method" | "encType"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
    readOnly: boolean;
    message: ReactNode;
    form?: FormComponent | "form";
    ref?: Ref<HTMLFormElement>;
}): import("react").JSX.Element;
