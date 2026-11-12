// The approval queue's data and its pure helpers (approval-queue.react.tsx draws the markup). It is
// the moderation queue's markup (.cap-mq, its rows and its open row) for things your own side
// drafted and a person approves one by one: a social post, a reply, a generated summary. Each item
// carries its text, which can be edited before the decision, what a check held it for, and the
// decisions the app offers for it. Nothing here knows what an item is: the site passes the words.

import type { Tone } from "../status/status.react.tsx";

// One decision on an item: posted as `intent` with the item's form, the edited text included.
export interface ApprovalAction {
  // The value posted as `intent`: "approve", "edit", "reject".
  intent: string;
  // The button's words: "Approve", "Save and check again".
  label: string;
  // The button's look. One primary per item at most; a one-way action is danger.
  variant?: "primary" | "danger" | "default";
  // A single key that runs it on the focused item ("a", "r"). Approve and reject only, by default.
  key?: string;
  // A one-way action asks first, in the confirm dialog, with focus on Cancel.
  confirm?: { title: string; lead?: string; body?: string[]; action: string };
}

export interface ApprovalItem {
  id: string;
  // Who or what it is for, as the row's title: an account, a channel, a recipient.
  who: string;
  // Where it stands, as a shape, a word and a color.
  status: { tone: Tone; word: string };
  // One line of context: where it came from, what it is for, what it costs.
  context?: string;
  // What a check held it for, one finding each; drawn as warnings.
  findings?: string[];
  // The text being approved.
  text: string;
  // The text can be changed before a decision; it posts as `name` (default "text").
  editable?: boolean;
  // When it was drafted.
  at?: string;
  actions: ApprovalAction[];
  // Hidden fields the decision posts beside `id` (a version, a kind).
  fields?: Record<string, string>;
}

// The keys a queue answers by default, when an action names none: a approves, r rejects.
export const DEFAULT_KEYS: Readonly<Record<string, string>> = { approve: "a", reject: "r" };

// The key an action answers, or undefined.
export function keyOf(action: ApprovalAction): string | undefined {
  return action.key ?? DEFAULT_KEYS[action.intent];
}

// The action a key runs on an item, or null where the item offers none for it.
export function actionForKey(
  item: Pick<ApprovalItem, "actions">,
  key: string,
): ApprovalAction | null {
  return item.actions.find((a) => keyOf(a) === key) ?? null;
}

// After an item is decided and leaves the queue, the item focus goes to: the next one, else the
// one before, else null (the empty state).
export function nextAfter(ids: readonly string[], decided: string): string | null {
  const at = ids.indexOf(decided);
  if (at === -1) return ids[0] ?? null;
  return ids[at + 1] ?? ids[at - 1] ?? null;
}

// The live line: how many items wait, and by what word, most first, in the order they first
// appear. "3 waiting: 2 awaiting approval, 1 held by the lint"; "Nothing waiting".
export function summaryLine(items: ReadonlyArray<Pick<ApprovalItem, "status">>): string {
  if (items.length === 0) return "Nothing waiting";
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.status.word, (counts.get(i.status.word) ?? 0) + 1);
  if (counts.size === 1) return `${items.length} waiting`;
  const parts = [...counts]
    .map(([word, n], order) => ({ word, n, order }))
    .sort((a, b) => b.n - a.n || a.order - b.order)
    .map(({ word, n }) => `${n} ${word.toLowerCase()}`);
  return `${items.length} waiting: ${parts.join(", ")}`;
}
