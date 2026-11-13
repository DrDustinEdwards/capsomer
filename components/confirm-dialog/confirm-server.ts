// The confirm page's server half: what an action checks again after the page posts, because markup is not a guard
// (confirm-dialog.md). No DOM, no framework: it runs in a Worker's action. A confirmation in a client handler is
// feedback; the gate is this.

/** The typed-word guard: case-insensitive, surrounding spaces ignored. No word, no guard. */
export function wordMatches(typed: string, word: string | undefined): boolean {
  if (!word) return true;
  return typed.trim().toLowerCase() === word.trim().toLowerCase();
}

/** The names ConfirmPage gives its typed field and its reason. */
export const CONFIRM_FIELD = "confirm";
export const REASON_FIELD = "reason";

const text = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Whether the posted form typed the word (case-insensitive, surrounding spaces ignored, as the page's pattern), and
 * carried a reason when one is required. `{ ok: true, reason }` or `{ ok: false, problem }`, the problem in words the
 * page shows in its alert box.
 */
export function confirmTyped(
  form: FormData | URLSearchParams,
  { word, reasonRequired = false }: { word?: string; reasonRequired?: boolean },
): { ok: true; reason: string } | { ok: false; problem: string } {
  const reason = text(form.get(REASON_FIELD)).trim();
  if (word && !wordMatches(text(form.get(CONFIRM_FIELD)), word))
    return { ok: false, problem: `Type ${word} to confirm.` };
  if (reasonRequired && !reason) return { ok: false, problem: "Give a reason." };
  return { ok: true, reason };
}

/**
 * A count typed to confirm a bulk delete ("type 3 to delete 3 items"), checked against the count read in this
 * request, never one the form carried. String-equal on purpose: Number() would accept "03", "+3", "3.0" and "" for
 * zero. A count that is not a positive integer never confirms.
 */
export function countMatches(typed: unknown, count: number): boolean {
  if (!Number.isInteger(count) || count <= 0) return false;
  return text(typed).trim() === String(count);
}
