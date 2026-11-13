import { type ReactNode } from "react";
import type { AiSampleResult } from "./ai-sample.ts";
export type { AiSampleField, AiSampleResult } from "./ai-sample.ts";
export interface AiSampleProps {
    title: ReactNode;
    live?: ReactNode;
    children: ReactNode;
    button: ReactNode;
    busyLabel?: ReactNode;
    hint?: ReactNode;
    busy?: boolean;
    result?: AiSampleResult | null;
    failed?: ReactNode;
    onGenerate: (data: FormData) => void;
    onChange?: () => void;
}
export declare function AiSample({ title, live, children, button, busyLabel, hint, busy, result, failed, onGenerate, onChange, }: AiSampleProps): import("react").JSX.Element;
