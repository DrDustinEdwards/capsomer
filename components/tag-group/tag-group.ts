// The tag group's behavior: a labeled list of tags, each with a remove button. The group is one
// tab stop (the shared toolbar's roving focus over the remove buttons), Left and Right move between
// tags, and Delete, Backspace, Enter or Space removes the focused one. Focus then goes to the next
// tag, else the one before, else the element named by data-cap-then (the field that adds tags),
// else the group, so it is never lost. A removal is reversible, so it happens at once and the
// page's message region (when there is one) offers Undo (DEFAULTS.md). No framework.
import { say } from "../message/message.ts";
import { attachToolbar } from "../toolbar/toolbar.ts";

const REMOVE = ".cap-tag-remove";

export interface TagRemoved {
  value: string;
  label: string;
}

const nameOf = (tag: HTMLElement) => tag.querySelector(".cap-tag-name")?.textContent?.trim() ?? "";

// Removes one tag and moves focus on. Fires a cancelable, bubbling `cap-tag-remove` on the group
// first, with { value, label }: an app that refuses the removal calls preventDefault().
export function removeTag(group: HTMLElement, tag: HTMLElement): boolean {
  const label = nameOf(tag);
  const value = tag.dataset.value ?? label;
  if (!group.dispatchEvent(new CustomEvent<TagRemoved>("cap-tag-remove", { bubbles: true, cancelable: true, detail: { value, label } }))) return false;
  const list = tag.parentElement;
  const next = tag.nextElementSibling;
  const to = (next ?? tag.previousElementSibling)?.querySelector<HTMLElement>(REMOVE);
  tag.remove();
  const then = group.dataset.capThen ? document.querySelector<HTMLElement>(group.dataset.capThen) : null;
  if (to) to.focus();
  else if (then) then.focus();
  else {
    group.tabIndex = -1;
    group.focus();
  }
  if (list && document.querySelector("[data-cap='message']")) {
    say(`Removed ${label}.`, {
      undone: `${label} is back.`,
      undo: () => {
        list.insertBefore(tag, next && next.parentElement === list ? next : null);
        group.dispatchEvent(new CustomEvent<TagRemoved>("cap-tag-restore", { bubbles: true, detail: { value, label } }));
      },
      returnFocus: () => tag.querySelector<HTMLElement>(REMOVE),
    });
  }
  return true;
}

// Attaches to every [data-cap="tag-group"] under root not yet attached. Returns a function that
// detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const group of root.querySelectorAll<HTMLElement>("[data-cap='tag-group']:not([data-cap-ready])")) {
    group.dataset.capReady = "";
    const detachRoving = attachToolbar(group, REMOVE);
    const act = (e: Event) => {
      const tag = (e.target as Element).closest<HTMLElement>(".cap-tag");
      if (!tag || !(e.target as Element).closest(REMOVE)) return;
      e.preventDefault();
      removeTag(group, tag);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") act(e);
    };
    group.addEventListener("click", act);
    group.addEventListener("keydown", onKey);
    undo.push(() => {
      detachRoving();
      group.removeEventListener("click", act);
      group.removeEventListener("keydown", onKey);
      delete group.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
