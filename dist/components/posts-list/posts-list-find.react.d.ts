import { type PostsData } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
export declare function PostsFind({ uid, query, kinds, tags, authors, dates, action, Form, plural, href, }: {
    uid: string;
    query: PostsData["query"];
    kinds: string[];
    tags: string[];
    authors: string[];
    dates: boolean;
    action: string;
    Form: FormComponent;
    plural: string;
    href: (q: PostsData["query"]) => string;
}): import("react").JSX.Element;
