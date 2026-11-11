import type { Tone } from "../status/status.react.tsx";
export interface ApprovalAction {
    intent: string;
    label: string;
    variant?: "primary" | "danger" | "default";
    key?: string;
    confirm?: {
        title: string;
        lead?: string;
        action: string;
    };
}
export interface ApprovalItem {
    id: string;
    who: string;
    status: {
        tone: Tone;
        word: string;
    };
    context?: string;
    findings?: string[];
    text: string;
    editable?: boolean;
    at?: string;
    actions: ApprovalAction[];
    fields?: Record<string, string>;
}
export declare const DEFAULT_KEYS: Readonly<Record<string, string>>;
export declare function keyOf(action: ApprovalAction): string | undefined;
export declare function actionForKey(item: Pick<ApprovalItem, "actions">, key: string): ApprovalAction | null;
export declare function nextAfter(ids: readonly string[], decided: string): string | null;
export declare function summaryLine(items: ReadonlyArray<Pick<ApprovalItem, "status">>): string;
