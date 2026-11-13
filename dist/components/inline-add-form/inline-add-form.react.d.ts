import type { ReactNode } from "react";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
export type { FormComponent };
export interface InlineAddFormProps {
    children: ReactNode;
    submit: ReactNode;
    hidden?: Record<string, string>;
    action?: string;
    Form?: FormComponent;
    pending?: boolean;
    label?: string;
}
export declare function InlineAddForm({ children, submit, hidden, action, Form, pending, label, }: InlineAddFormProps): import("react").JSX.Element;
