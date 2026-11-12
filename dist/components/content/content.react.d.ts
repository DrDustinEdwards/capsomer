import { type FormEvent, type ReactNode } from "react";
import type { BulkItem, BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import { type ConfirmRequest, type IntentResult, type SubmitIntent } from "./content.ts";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function ResultBox({ result, action, Form, keyHint, }: {
    result: IntentResult | null;
    action: string;
    Form: FormComponent;
    keyHint: boolean;
}): import("react").JSX.Element;
export interface IntentsOptions {
    action: string;
    Form: FormComponent;
    submit?: SubmitIntent;
    result?: IntentResult | null;
    names: ReadonlyMap<string, string>;
    cancelHref: string;
    onDone?: () => void;
}
export interface Intents {
    onSubmit: (e: FormEvent<HTMLElement>) => void;
    rootRef: {
        current: HTMLElement | null;
    };
    setRoot: (el: HTMLElement | null) => void;
    outcomes: BulkOutcome[];
    dismissOutcomes: () => void;
    resultBox: ReactNode;
    confirmPage: ReactNode;
    confirmDialog: ReactNode;
    latest: IntentResult | null;
    ask: (request: ConfirmRequest) => void;
    run: (form: FormData) => Promise<IntentResult | null>;
    show: (result: IntentResult) => void;
}
export declare function useIntents({ action, Form, submit, result, names, cancelHref, onDone, }: IntentsOptions): Intents;
export interface ContentBulkBarProps {
    formId: string;
    action: string;
    Form: FormComponent;
    formClass: string;
    items: readonly BulkItem[];
    total: number;
    onSelectAll?: () => void;
    onClear: () => void;
    plural: string;
    actions: ReadonlyArray<{
        intent: string;
        label: string;
        destructive?: boolean;
    }>;
    tag: boolean;
    tagName?: string;
    intents: Pick<Intents, "outcomes" | "dismissOutcomes">;
}
export declare function ContentBulkBar({ formId, action, Form, formClass, items, total, onSelectAll, onClear, plural, actions, tag, tagName, intents, }: ContentBulkBarProps): import("react").JSX.Element;
