import { type ReactNode } from "react";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type SelectOption } from "../select/select.react.tsx";
import { type EngineJob, type EngineSettingsLike } from "./ai-engine-settings.ts";
export type { EngineJob, EngineSettingsLike, FormComponent };
export interface AiEngineSettingsProps {
    settings: EngineSettingsLike;
    models: Readonly<Partial<Record<string, string>>>;
    jobs: readonly EngineJob[];
    modelOptions: readonly SelectOption[];
    efforts: Readonly<Partial<Record<string, string>>>;
    effortOptions: readonly SelectOption[];
    ready: {
        subscription: boolean;
        api: boolean;
    };
    readyNote?: ReactNode;
    spentMicros: number;
    usage: ReadonlyArray<{
        job: string;
        effort?: string | null;
        calls: number;
        micros: number;
    }>;
    capHelp?: ReactNode;
    costNote?: ReactNode;
    action?: string;
    Form?: FormComponent;
    pending?: boolean;
}
export declare function AiEngineSettings({ settings, models, jobs, modelOptions, efforts, effortOptions, ready, readyNote, spentMicros, usage, capHelp, costNote, action, Form, pending, }: AiEngineSettingsProps): import("react").JSX.Element;
