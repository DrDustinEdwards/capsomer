export declare function wordMatches(typed: string, word: string | undefined): boolean;
export declare const CONFIRM_FIELD = "confirm";
export declare const REASON_FIELD = "reason";
/** Whether the posted form typed the word and carried a reason when one is required: `{ ok: true, reason }` or `{ ok: false, problem }`. */
export declare function confirmTyped(form: FormData | URLSearchParams, { word, reasonRequired }: {
    word?: string;
    reasonRequired?: boolean;
}): {
    ok: true;
    reason: string;
} | {
    ok: false;
    problem: string;
};
