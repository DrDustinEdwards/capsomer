// The confirm page's server half: what an action checks again after the page posts, because markup is not a
// guard (confirm-dialog.md). No DOM; runs in a Worker's action. A client confirmation is feedback; the gate is this.

export function wordMatches(typed: string, word: string | undefined): boolean {
  if (!word) return true;
  return typed.trim().toLowerCase() === word.trim().toLowerCase();
}

export const CONFIRM_FIELD = "confirm";
export const REASON_FIELD = "reason";

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Whether the posted form typed the word and carried a reason when one is required: `{ ok: true, reason }` or `{ ok: false, problem }`. */
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
