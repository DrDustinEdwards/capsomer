import type { ComponentType, FormHTMLAttributes } from "react";
export type FormComponent = ComponentType<Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "encType" | "method"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
}>;
export declare const PlainForm: FormComponent;
