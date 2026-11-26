import { type ContentLabels, type IntentResult, type PostRow, type PostsData, type ScheduledUpdateView, type SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { contentStatus } from "./posts-list.ts";
export { PostScheduledUpdate, type PostScheduledUpdateProps } from "./posts-list-update.react.tsx";
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
export declare function PostsList({ data, action, Form, submit, result, labels, now, }: PostsListProps): import("react").JSX.Element;
