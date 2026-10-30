import type { ContentLabels, IntentResult, PostRow, PostsData, ScheduledUpdateView, SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../content/content.react.tsx";
import { contentStatus } from "./posts-list.ts";
export { contentStatus };
export type { ContentLabels, IntentResult, PostRow, PostsData, ScheduledUpdateView, SubmitIntent };
export type { FormComponent };
export interface PostsListProps {
    data: PostsData;
    action: string;
    Form?: FormComponent;
    submit?: SubmitIntent;
    result?: IntentResult | null;
    labels?: ContentLabels;
    now?: number;
}
export declare function PostsList({ data, action, Form, submit, result, labels, now }: PostsListProps): import("react").JSX.Element;
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
export declare function PostScheduledUpdate({ data, action, Form, submit, result, liveSince, crumbs, headingLevel, labels, now }: PostScheduledUpdateProps): import("react").JSX.Element;
