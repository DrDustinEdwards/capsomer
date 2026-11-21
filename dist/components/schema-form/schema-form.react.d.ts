import type { ComponentType, FormHTMLAttributes, ReactNode } from "react";
import { type FieldSpec, type SpecError } from "./schema-form.ts";
export interface SpecInputProps {
    spec: FieldSpec;
    id: string;
    value: unknown;
    onChange?: (value: unknown) => void;
    error?: ReactNode;
}
export type SpecRenderers = Partial<Record<string, (props: SpecInputProps) => ReactNode>>;
export declare function FieldFromSpec({ spec, value, onChange, error, idPrefix, renderers, }: {
    spec: FieldSpec;
    value?: unknown;
    onChange?: (value: unknown) => void;
    error?: ReactNode;
    idPrefix?: string;
    renderers?: SpecRenderers;
}): import("react").JSX.Element;
export declare function SchemaFields({ specs, values, onChange, errors, idPrefix, renderers, }: {
    specs: readonly FieldSpec[];
    values?: Record<string, unknown>;
    onChange?: (key: string, value: unknown) => void;
    errors?: readonly SpecError[];
    idPrefix?: string;
    renderers?: SpecRenderers;
}): import("react").JSX.Element;
export declare function JsonField({ name, value }: {
    name: string;
    value: unknown;
}): import("react").JSX.Element;
export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement>>;
export declare function SettingsForm({ specs, values, errors, status, pending, submitLabel, pendingLabel, form: Tag, method, action, idPrefix, renderers, children, ...rest }: Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "style"> & {
    specs: readonly FieldSpec[];
    values?: Record<string, unknown>;
    errors?: readonly SpecError[];
    status?: ReactNode;
    pending?: boolean;
    submitLabel?: string;
    pendingLabel?: string;
    form?: FormComponent | "form";
    idPrefix?: string;
    renderers?: SpecRenderers;
    children?: ReactNode;
}): import("react").JSX.Element;
