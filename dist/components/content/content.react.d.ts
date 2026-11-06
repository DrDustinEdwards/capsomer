import { type ComponentType, type FormEvent, type FormHTMLAttributes, type ReactNode } from "react";
import type { BulkItem, BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import { type ConfirmRequest, type IntentResult, type SubmitIntent } from "./content.ts";
export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement> & {
    method?: "get" | "post";
}>;
export declare const PlainForm: FormComponent;
export declare function ResultBox({ result, action, Form, keyHint }: {
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
    outcomes: BulkOutcome[];
    dismissOutcomes: () => void;
    resultBox: ReactNode;
    confirmPage: ReactNode;
    confirmDialog: ReactNode;
    latest: IntentResult | null;
    ask: (request: ConfirmRequest) => void;
    run: (form: FormData) => Promise<IntentResult | null>;
}
export declare function useIntents({ action, Form, submit, result, names, cancelHref, onDone }: IntentsOptions): Intents;
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
export declare function ContentBulkBar({ formId, action, Form, formClass, items, total, onSelectAll, onClear, plural, actions, tag, tagName, intents }: ContentBulkBarProps): import("react").JSX.Element;
