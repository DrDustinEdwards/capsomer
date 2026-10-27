import type { ContentLabels, IntentResult, PostRow, PostsData, SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../content/content.react.tsx";
import { contentStatus } from "./posts-list.ts";
export { contentStatus };
export type { ContentLabels, IntentResult, PostRow, PostsData, SubmitIntent };
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
