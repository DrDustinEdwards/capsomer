import { type ComponentProps, type ComponentType, type FormHTMLAttributes, type ReactNode, type Ref } from "react";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function ReadOnlyForm({ readOnly, message, form: Form, onSubmit, className, children, ref, ...rest }: Omit<FormHTMLAttributes<HTMLFormElement>, "style" | "action" | "method" | "encType"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
    readOnly: boolean;
    message: ReactNode;
    form?: ComponentType<ComponentProps<FormComponent> & {
        ref?: Ref<HTMLFormElement>;
    }>;
    ref?: Ref<HTMLFormElement>;
}): import("react").JSX.Element;
