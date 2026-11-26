import { type ContentLabels, type IntentResult, type ScheduledUpdateView, type SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
export interface PostScheduledUpdateProps {
    data: ScheduledUpdateView;
    action: string;
    Form?: FormComponent;
    submit?: SubmitIntent;
    result?: IntentResult | null;
    liveSince?: string | null;
    crumbs?: Array<{
        label: string;
        href?: string;
    }>;
    headingLevel?: "h1" | "h2" | "h3";
    labels?: ContentLabels;
    now?: number;
}
export declare function PostScheduledUpdate({ data, action, Form, submit, result, liveSince, crumbs, headingLevel, labels, now, }: PostScheduledUpdateProps): import("react").JSX.Element;
