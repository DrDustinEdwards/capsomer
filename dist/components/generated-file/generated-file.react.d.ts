import type { ReactNode } from "react";
import { type GeneratedRecord, type GeneratedState } from "./generated-file.ts";
export interface GeneratedFileFormProps {
    className: string;
    children: ReactNode;
}
export interface GeneratedFileProps {
    title: ReactNode;
    description?: ReactNode;
    record: GeneratedRecord | null | undefined;
    now?: number;
    lockMs?: number;
    format?: string;
    downloadHref: string;
    downloadLabel?: string;
    generateLabel?: string;
    regenerateLabel?: string;
    action?: string;
    fields?: Record<string, string>;
    renderForm?: (props: GeneratedFileFormProps) => ReactNode;
    generate?: boolean;
    busy?: boolean;
    messages?: Partial<Record<GeneratedState, ReactNode>>;
    level?: 2 | 3;
    children?: ReactNode;
}
export declare function GeneratedFile({ title, description, record, now, lockMs, format, downloadHref, downloadLabel, generateLabel, regenerateLabel, action, fields, renderForm, generate, busy, messages, level, children, }: GeneratedFileProps): import("react").JSX.Element;
