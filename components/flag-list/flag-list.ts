// The flag list's behavior and its pure helpers. A flag is raised against a draft by a check, a
// reviewer or an AI, and stays on the record: resolving it keeps it, with who and when. A
// suggestion a flag carries is inert until the owner applies it; nothing here applies one by
// itself. The whole record is in the delivered HTML; this module only adds what a person does
// to it (resolve, dismiss, reopen, apply, apply a batch) and keeps the anchors true to the
// current text. No framework; the React wrapper reuses the pure functions.
//
// A result is said in a polite region, a refusal in an alert. A flag is a question for the
// owner, never a decision; an open flag holds publish until it is fixed or dismissed.

import { plural } from "@drdustinedwards/site-helpers/text";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { type SayOptions, fail, say } from "../message/message.ts";
import { attachRowList } from "../row-list/row-list.ts";
import {
  type Flag,
  type FlagState,
  type Resolution,
  anchorStatus,
  appliable,
  applySuggestion,
  countFlags,
  revertSuggestion,
  summaryLine,
} from "./flag-list-model.ts";
import { part, readFlag, flagRows, readFlags, type Ctx, renderFlag } from "./flag-list-rows.ts";
export { readFlag, flagRows, readFlags, renderFlag } from "./flag-list-rows.ts";

export {
  groupFlags,
  countFlags,
  summaryLine,
  anchorStatus,
  applySuggestion,
  revertSuggestion,
  appliable,
} from "./flag-list-model.ts";
export type {
  FlagKind,
  FlagState,
  Resolution,
  AnchorStatus,
  FlagAnchor,
  FlagSuggestion,
  Flag,
  FlagCounts,
} from "./flag-list-model.ts";

// The page.

const READY = "data-cap-ready";
export interface FlagTextIO {
  getText(): string;
  setText(text: string): void;
}

export interface FlagListHandle {
  // Re-reads the current text and updates every flag's anchor, the counts and the batch button.
  refresh(): void;
  detach(): void;
}

// The text a `data-text-source` selector names: a textarea or input's value, else an element's text.
function ioFor(selector: string | undefined): FlagTextIO | undefined {
  if (!selector) return undefined;
  const find = () => document.querySelector<HTMLElement>(selector);
  if (!find()) return undefined;
  return {
    getText: () => {
      const e = find();
      return e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
        ? e.value
        : (e?.textContent ?? "");
    },
    setText: (t) => {
      const e = find();
      if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) {
        e.value = t;
        e.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (e) e.textContent = t;
    },
  };
}

function setCount(root: HTMLElement, name: string, n: number): void {
  for (const c of root.querySelectorAll<HTMLElement>(`[data-count='${name}']`))
    c.textContent = String(n);
}

export function attachFlagList(root: HTMLElement, io?: FlagTextIO): FlagListHandle {
  const owner = root.hasAttribute("data-owner");
  const ctx: Ctx = { owner, ownerName: root.dataset.ownerName ?? "" };
  const viewer = root.dataset.viewer ?? "";
  const list = root.querySelector<HTMLElement>(".cap-flags-list");
  const detachRows = list ? attachRowList(list) : () => {};

  const live = (text: string) => {
    const region = part(root, "live");
    if (!region) return;
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = text;
    });
  };
  // The page's message region says it, with Undo; without one the list's own polite region does.
  const announce = (text: string, opts: SayOptions = {}) => {
    if (document.querySelector("[data-cap='message']")) say(text, opts);
    else live(text);
  };
  const problem = (text: string) => {
    if (document.querySelector("[data-cap='message']")) fail(text);
    else live(text);
  };

  const emit = (li: HTMLElement) => {
    const f = readFlag(li);
    root.dispatchEvent(
      new CustomEvent("cap:flag-change", {
        bubbles: true,
        detail: {
          id: f.id,
          state: f.state,
          resolution: f.resolution ?? null,
          resolvedBy: f.resolvedBy ?? null,
          resolvedAt: f.resolvedAt ?? null,
        },
      }),
    );
  };

  // Group headings, the summary, the filter's counts and the batch button follow the rows.
  const tally = () => {
    const flags = readFlags(root);
    const c = countFlags(flags);
    const summary = part(root, "summary");
    if (summary) summary.textContent = summaryLine(c);
    setCount(root, "open", c.open);
    setCount(root, "resolved", c.resolved);
    setCount(root, "all", c.total);
    for (const kind of ["blocking", "advisory"] as const) {
      const mine = flags.filter((f) => f.kind === kind);
      const open = mine.filter((f) => f.state === "open").length;
      const head = root.querySelector<HTMLElement>(
        `.cap-flag-group[data-group='${kind}'] .cap-flag-group-count`,
      );
      if (head) head.textContent = `${open} open, ${mine.length - open} resolved`;
    }
    const text = io?.getText();
    const n = appliable(flags, text).length;
    const batch = part<HTMLButtonElement>(root, "apply-all");
    if (batch) {
      batch.replaceChildren(`Apply ${plural(n, "suggestion")}`);
      batch.hidden = n === 0 || !owner;
    }
    const note = part(root, "owner-note");
    if (note) note.hidden = owner || appliable(flags, text).length === 0;
  };

  // Moves the open flags to the top of their group so the record reads open first.
  const order = () => {
    if (!list) return;
    for (const kind of ["blocking", "advisory"] as const) {
      const group = list.querySelector<HTMLElement>(
        `.cap-flag-group[data-group='${kind}'] .cap-flag-group-rows`,
      );
      if (!group) continue;
      const rows = flagRows(group);
      const sorted = [
        ...rows.filter((r) => r.dataset.state === "open"),
        ...rows.filter((r) => r.dataset.state === "resolved"),
      ];
      sorted.forEach((r, i) => {
        if (group.children[i] !== r) group.insertBefore(r, group.children[i] ?? null);
      });
    }
  };

  // Re-reads the text: a flag whose passage appeared or vanished is redrawn, then the counts.
  const refresh = () => {
    const text = io?.getText();
    if (text !== undefined) {
      for (const li of flagRows(root)) {
        // A closed flag keeps what it said when it was closed: it is a record, not a live check.
        if (!li.dataset.anchorId || li.dataset.state === "resolved") continue;
        const next = anchorStatus(readFlag(li), text);
        if (next === li.dataset.anchor) continue;
        li.dataset.anchor = next;
        renderFlag(li, ctx);
      }
    }
    tally();
  };

  // Where focus goes if the row leaves the filtered view: chosen before the change, as the next
  // visible row (or the one before it), so the order the rows are re-sorted into does not matter.
  const heirOf = (li: HTMLElement): HTMLElement | null => {
    const visible = (e: HTMLElement) => e.getClientRects().length > 0;
    const all = flagRows(root);
    const here = all.indexOf(li);
    return all.slice(here + 1).find(visible) ?? all.slice(0, here).reverse().find(visible) ?? null;
  };

  // After a row's state changed: focus stays in the row on its new first action, or, when the row
  // is no longer shown, goes to its heir. It is never left on nothing.
  const settle = (li: HTMLElement, hadFocus: boolean, heir: HTMLElement | null) => {
    if (!hadFocus) return;
    const visible = (e: HTMLElement) => e.getClientRects().length > 0;
    const first = (row: HTMLElement) =>
      [
        ...row.querySelectorAll<HTMLElement>(".cap-row-actions button"),
        ...row.querySelectorAll<HTMLElement>(".cap-row-title a"),
      ].find(visible);
    const target = first(li) ?? (heir ? first(heir) : undefined);
    if (target) {
      target.focus();
      return;
    }
    (part(root, "filter")?.querySelector<HTMLElement>("input:checked") ?? root).focus();
  };

  const stamp = (li: HTMLElement, state: FlagState, resolution?: Resolution) => {
    li.dataset.state = state;
    if (state === "resolved") {
      li.dataset.resolution = resolution ?? "resolved";
      if (viewer) li.dataset.resolvedBy = viewer;
      else delete li.dataset.resolvedBy;
      li.dataset.resolvedAt = new Date().toISOString();
    } else {
      delete li.dataset.resolution;
      delete li.dataset.resolvedBy;
      delete li.dataset.resolvedAt;
    }
  };

  const snapshot = (li: HTMLElement) => ({
    state: li.dataset.state as FlagState,
    resolution: li.dataset.resolution as Resolution | undefined,
    by: li.dataset.resolvedBy,
    at: li.dataset.resolvedAt,
  });
  const restore = (li: HTMLElement, s: ReturnType<typeof snapshot>) => {
    li.dataset.state = s.state;
    for (const [k, v] of [
      ["resolution", s.resolution],
      ["resolvedBy", s.by],
      ["resolvedAt", s.at],
    ] as const) {
      if (v) li.dataset[k] = v;
      else delete li.dataset[k];
    }
  };

  const primary = (li: HTMLElement) => () =>
    li.querySelector<HTMLElement>(".cap-row-actions button") ??
    li.querySelector<HTMLElement>(".cap-row-title a");

  const change = (
    li: HTMLElement,
    state: FlagState,
    resolution: Resolution | undefined,
    said: string,
    undone: string,
  ) => {
    const hadFocus = li.contains(document.activeElement);
    const heir = heirOf(li);
    const before = snapshot(li);
    stamp(li, state, resolution);
    renderFlag(li, ctx);
    refresh();
    order();
    emit(li);
    settle(li, hadFocus, heir);
    announce(said, {
      undo: () => {
        restore(li, before);
        renderFlag(li, ctx);
        refresh();
        order();
        emit(li);
      },
      undone,
      returnFocus: primary(li),
    });
  };

  const applyOne = (li: HTMLElement) => {
    if (!io || !owner) return;
    const flag = readFlag(li);
    const text = io.getText();
    const next = applySuggestion(text, flag);
    if (next === null) {
      refresh();
      return problem("Could not apply the suggestion: the passage it replaces has changed.");
    }
    const hadFocus = li.contains(document.activeElement);
    const heir = heirOf(li);
    const before = snapshot(li);
    // Closed first, then the text: the passage is gone once replaced, and a closed flag keeps
    // what it said, so the editor's input event must not find it open and call it lost.
    stamp(li, "resolved", "applied");
    renderFlag(li, ctx);
    io.setText(next);
    refresh();
    order();
    emit(li);
    settle(li, hadFocus, heir);
    announce("Suggestion applied to the draft.", {
      undo: () => {
        const back = revertSuggestion(io.getText(), flag);
        if (back === null)
          throw new Error(
            "The draft has changed around that passage since. Undo the edit in the editor instead.",
          );
        io.setText(back);
        restore(li, before);
        renderFlag(li, ctx);
        refresh();
        order();
        emit(li);
      },
      undone: "Suggestion taken back. The passage is as it was.",
      returnFocus: primary(li),
    });
  };

  // A batch rewrites the draft, so it is previewed in the shared confirm dialog and only then done.
  const applyAll = async () => {
    if (!io || !owner) return;
    const rows = flagRows(root);
    const todo = rows.filter(
      (li) =>
        li.dataset.state === "open" &&
        li.querySelector(".cap-flag-after-text") &&
        li.dataset.anchor === "found",
    );
    if (todo.length === 0) return;
    const flags = todo.map(readFlag);
    const quoted = (s: string) => `“${s}”`;
    const opener = part<HTMLElement>(root, "apply-all");
    await confirm({
      title: `Apply ${plural(todo.length, "suggestion")}?`,
      lead: "This rewrites the draft.",
      body: flags.map(
        (f) =>
          `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`,
      ),
      action: `Apply ${plural(todo.length, "suggestion")}`,
      returnTo:
        part<HTMLElement>(root, "filter")?.querySelector<HTMLElement>("input:checked") ?? null,
      perform: async () => {
        const text = io.getText();
        let next = text;
        const done: number[] = [];
        flags.forEach((f, i) => {
          const out = applySuggestion(next, f);
          if (out !== null) {
            next = out;
            done.push(i);
          }
        });
        if (done.length === 0) throw new Error("None of the passages could be found any more.");
        const before = done.map((i) => snapshot(todo[i] as HTMLElement));
        for (const i of done) {
          stamp(todo[i] as HTMLElement, "resolved", "applied");
          renderFlag(todo[i] as HTMLElement, ctx);
        }
        io.setText(next);
        refresh();
        order();
        for (const i of done) emit(todo[i] as HTMLElement);
        const skipped = flags.length - done.length;
        announce(
          `Applied ${plural(done.length, "suggestion")} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`,
          {
            undo: () => {
              let back = io.getText();
              for (const i of [...done].reverse()) {
                const out = revertSuggestion(back, flags[i] as Flag);
                if (out === null)
                  throw new Error(
                    "The draft has changed around those passages since. Undo the edits in the editor instead.",
                  );
                back = out;
              }
              io.setText(back);
              done.forEach((i, k) => {
                restore(todo[i] as HTMLElement, before[k] as ReturnType<typeof snapshot>);
                renderFlag(todo[i] as HTMLElement, ctx);
              });
              refresh();
              order();
              for (const i of done) emit(todo[i] as HTMLElement);
            },
            undone: "Suggestions taken back. The passages are as they were.",
            returnFocus: () =>
              opener && !opener.hidden
                ? opener
                : (part<HTMLElement>(root, "filter")?.querySelector<HTMLElement>("input:checked") ??
                  null),
          },
        );
      },
    });
  };

  const onClick = (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-cap-part]");
    if (!btn || !root.contains(btn)) return;
    const kind = btn.dataset.capPart;
    const li = btn.closest<HTMLElement>("li.cap-flag");
    if (kind === "apply-all") return void applyAll();
    if (!li) return;
    if (kind === "resolve") change(li, "resolved", "resolved", "Flag resolved.", "Flag reopened.");
    else if (kind === "dismiss")
      change(li, "resolved", "dismissed", "Flag dismissed.", "Flag reopened.");
    else if (kind === "reopen")
      change(li, "open", undefined, "Flag reopened.", "Flag closed again.");
    else if (kind === "apply") applyOne(li);
  };
  root.addEventListener("click", onClick);

  const source = root.dataset.textSource ? document.querySelector(root.dataset.textSource) : null;
  const onInput = () => refresh();
  source?.addEventListener("input", onInput);

  tally();
  if (io) refresh();

  return {
    refresh,
    detach() {
      root.removeEventListener("click", onClick);
      source?.removeEventListener("input", onInput);
      detachRows();
      root.removeAttribute(READY);
    },
  };
}

// Attaches to every [data-cap="flag-list"] under root not attached yet. The text the anchors are
// read against is the element named by data-text-source (a textarea's value, or an element's
// text). Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const handles: FlagListHandle[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='flag-list']:not([data-cap-ready])",
  )) {
    el.setAttribute(READY, "");
    handles.push(attachFlagList(el, ioFor(el.dataset.textSource)));
  }
  return () => handles.forEach((h) => h.detach());
}
