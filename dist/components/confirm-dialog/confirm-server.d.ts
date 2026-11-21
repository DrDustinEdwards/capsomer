/** The typed-word guard: case-insensitive, surrounding spaces ignored. No word, no guard. */
export declare function wordMatches(typed: string, word: string | undefined): boolean;
/** The names ConfirmPage gives its typed field and its reason. */
export declare const CONFIRM_FIELD = "confirm";
export declare const REASON_FIELD = "reason";
/**
 * Whether the posted form typed the word (case-insensitive, surrounding spaces ignored, as the page's pattern), and
 * carried a reason when one is required. `{ ok: true, reason }` or `{ ok: false, problem }`, the problem in words the
 * page shows in its alert box.
 */
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
