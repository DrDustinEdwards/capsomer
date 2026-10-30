import { type MentionsData, type MentionsQuery } from "../content/content.ts";
import { type ModAction, type ModView } from "../moderation-queue/moderation-queue.ts";
export declare function mentionsHref(base: string, q: MentionsQuery): string;
export declare function withMentions(q: MentionsQuery, change: Partial<MentionsQuery>): MentionsQuery;
export declare function currentView(data: Pick<MentionsData, "query" | "counts">): ModView;
export type MentionIntent = ModAction | "delete";
export interface OfferedAction {
    intent: MentionIntent;
    label: string;
    destructive?: boolean;
}
export declare function mentionActions(data: Pick<MentionsData, "offers" | "can" | "query" | "counts">): {
    bulk: OfferedAction[];
    withheld: string[];
};
export declare function countLine(data: Pick<MentionsData, "rows" | "query" | "counts">): string;
export declare function emptyWords(view: ModView): {
    kind: "all-clear" | "nothing-yet";
    title: string;
    text: string;
};
export declare function sweepLabel(expiring: MentionsData["expiring"]): {
    n: number;
    label: string;
};
