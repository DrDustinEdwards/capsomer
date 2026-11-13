import { type ComponentType, type FormHTMLAttributes, type ReactNode, type Ref } from "react";
export type FormComponent = ComponentType<Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "encType"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
}>;
export declare function ReadOnlyForm({ readOnly, message, form, onSubmit, className, children, ref, ...rest }: Omit<FormHTMLAttributes<HTMLFormElement>, "style" | "action" | "method" | "encType"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
    readOnly: boolean;
    message: ReactNode;
    form?: FormComponent | "form";
    ref?: Ref<HTMLFormElement>;
}): import("react").JSX.Element;
