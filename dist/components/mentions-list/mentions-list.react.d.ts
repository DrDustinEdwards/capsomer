import type { IntentResult, MentionsData, SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../content/content.react.tsx";
import { type Mention } from "../moderation-queue/moderation-queue.ts";
export type { FormComponent, IntentResult, Mention, MentionsData, SubmitIntent };
export interface MentionsListProps {
    data: MentionsData;
    action: string;
    Form?: FormComponent;
    submit?: SubmitIntent;
    result?: IntentResult | null;
    now?: number;
}
export declare function MentionsList({ data, action, Form, submit, result, now }: MentionsListProps): import("react").JSX.Element;
