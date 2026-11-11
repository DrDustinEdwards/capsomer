import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type AiJobAnswer, type JobEngine } from "./ai-job-buttons.ts";
export type { AiJobAnswer, FormComponent, JobEngine };
export interface AiJobButton {
    job: string;
    label: string;
}
export interface AiJobButtonsProps {
    action: string;
    buttons: readonly AiJobButton[];
    fields?: Record<string, string>;
    Form?: FormComponent;
    answer?: AiJobAnswer | null;
    pending?: boolean;
    engineNames?: Record<JobEngine, string>;
    openLabel?: string;
}
export declare function AiJobButtons({ action, buttons, fields, Form, answer, pending, engineNames, openLabel, }: AiJobButtonsProps): import("react").JSX.Element;
