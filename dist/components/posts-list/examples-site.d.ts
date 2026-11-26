import type { IntentResult, PostRow } from "../content/content.ts";
interface Win {
    postsLog: Array<Record<string, string | string[]>>;
}
export declare const win: Win;
export declare function useSite(initial?: PostRow[]): {
    rows: PostRow[];
    submit: (form: FormData) => Promise<IntentResult>;
};
export {};
