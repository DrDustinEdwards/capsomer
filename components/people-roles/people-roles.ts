// The members page's behaviour and the words it shows. Every action is a form post, so the
// page works with no script; this module adds what a form cannot do alone: the confirm
// before a removal, the add form's end date following the chosen title, and the review's
// running tally. The rules (who may manage whom, what may be granted, which end dates are
// allowed) live in the app's server, in site-runtime's `./members`; this module only shows
// what the server already decided.

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { enhance as enhanceFields } from "../field/field.ts";
import { enhance as enhanceMenus } from "../menu/menu.ts";

// One person as the page shows them. The server fills `manageable` and `renewTo` from
// site-runtime's checkChange and defaultEndDate, so the page never offers what it would refuse.
export interface PersonRow {
  email: string;
  name: string;
  // The title's label, as the app names it: "Lab worker".
  title: string;
  // YYYY-MM-DD in UTC, or null for a title that does not expire.
  endDate: string | null;
  status: "active" | "expired" | "removed";
  // Whether the allow list in Cloudflare matches this row yet.
  sync: "ready" | "waiting" | "failed";
  // Cloudflare's answer when it refused, in its words.
  syncError?: string;
  // The viewer may renew, change and remove this person.
  manageable: boolean;
  // Renew sets this end date; null when the title does not expire.
  renewTo?: string | null;
  // The row is the viewer's own.
  you?: boolean;
  // When the row was removed or expired, YYYY-MM-DD.
  endedOn?: string;
}

export interface TitleOption {
  // The title's id, posted as `title`.
  value: string;
  label: string;
  // The default end date for someone given this title today, or null if it does not expire.
  defaultEnd: string | null;
}

export interface HistoryEntry {
  // ISO time.
  at: string;
  // Who made the change, as a name or an actor id.
  by: string;
  action: "add" | "change_title" | "renew" | "remove" | "expire" | "review_keep";
  // The title before and after, and the end date after, where the action has them.
  fromTitle?: string;
  toTitle?: string;
  endDate?: string | null;
  reason?: string;
  cloudflare: "accepted" | "pending" | "failed";
  cloudflareError?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;
// How long before an end date the row shows that it ends soon, matching the review (21 days).
export const SOON_DAYS = 21;

export const REASON_MISSING = "Type a reason. It is recorded with the change.";

// "18 Dec 2026", from a YYYY-MM-DD date, in UTC.
export function dayText(date: string): string {
  const t = new Date(`${date}T00:00:00Z`);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

// "2 Oct 2026, 14:52 UTC", from an ISO time.
export function timeText(iso: string): string {
  const t = new Date(iso);
  const hh = String(t.getUTCHours()).padStart(2, "0");
  const mm = String(t.getUTCMinutes()).padStart(2, "0");
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}, ${hh}:${mm} UTC`;
}

// Whole days from `now` until the end of the end date (0 on the end date itself).
export function daysLeft(endDate: string, now: number): number {
  return Math.floor((Date.parse(`${endDate}T00:00:00Z`) + DAY_MS - 1 - now) / DAY_MS);
}

// The Access column's words.
export function accessText(p: Pick<PersonRow, "endDate" | "status" | "endedOn">, now: number): string {
  if (p.status === "removed") return p.endedOn ? `Removed ${dayText(p.endedOn)}` : "Removed";
  if (p.status === "expired") return `Ended ${dayText(p.endedOn ?? (p.endDate as string))}`;
  if (p.endDate === null) return "Does not expire";
  const left = daysLeft(p.endDate, now);
  if (left === 0) return `Ends today, ${dayText(p.endDate)}`;
  if (left <= SOON_DAYS) return `Ends ${dayText(p.endDate)}, in ${left} day${left === 1 ? "" : "s"}`;
  return `Ends ${dayText(p.endDate)}`;
}

// Whether the end date is close enough to mark (the review is open).
export function endsSoon(p: Pick<PersonRow, "endDate" | "status">, now: number): boolean {
  return p.status === "active" && p.endDate !== null && daysLeft(p.endDate, now) <= SOON_DAYS;
}

// The Cloudflare column's words. A removed or expired person is "Ready" once Cloudflare has
// taken them off, so the column always answers "does Cloudflare match this row yet".
export function syncText(p: Pick<PersonRow, "sync" | "status">): string {
  if (p.sync === "waiting") return "Waiting for Cloudflare";
  if (p.sync === "failed") return "Cloudflare refused";
  return p.status === "active" ? "Ready: they can sign in" : "Ready: signed out";
}

// One history line's words.
export function actionText(e: HistoryEntry): string {
  const until = e.endDate ? `, until ${dayText(e.endDate)}` : "";
  switch (e.action) {
    case "add":
      return `Added as ${e.toTitle}${until}`;
    case "change_title":
      return `Title changed from ${e.fromTitle} to ${e.toTitle}`;
    case "renew":
      return `Renewed${until}`;
    case "review_keep":
      return `Kept at review${until}`;
    case "remove":
      return "Removed";
    case "expire":
      return "Access ended on the end date";
  }
}

export function cloudflareText(e: Pick<HistoryEntry, "cloudflare" | "cloudflareError">): string {
  if (e.cloudflare === "accepted") return "Cloudflare accepted";
  if (e.cloudflare === "pending") return "Waiting for Cloudflare";
  return e.cloudflareError ? `Cloudflare refused: ${e.cloudflareError}` : "Cloudflare refused";
}

// The add form's help line under the end date.
export function endHelp(defaultEnd: string | null): string {
  return defaultEnd ? `Defaults to the end of the term, ${dayText(defaultEnd)}. You can choose an earlier date.` : "This title does not expire.";
}

// The review's running count.
export function tallyText(keep: number, remove: number, open: number): string {
  const parts = [`${keep} to keep`, `${remove} to remove`];
  if (open) parts.push(`${open} not answered`);
  return `${parts.join(", ")}.`;
}

// The removal's confirm, from the server's own words: who, and what follows.
export function removeBody(name: string, email: string): string[] {
  return [`${name} is refused on their next request.`, `${email} comes off the allow list and their Cloudflare seat is freed.`, "Their row stays, marked removed, so their work keeps their name."];
}

// Who a removal is for, from the row the form sits in (or the form's own data).
export function removeTarget(form: HTMLFormElement): { name: string; email: string } {
  const row = form.closest<HTMLElement>("tr[data-email]");
  const email = row?.dataset.email ?? form.dataset.email ?? (form.elements.namedItem("email") as HTMLInputElement | null)?.value ?? "";
  return { name: row?.dataset.name ?? form.dataset.name ?? email, email };
}

// Asks before a removal; on Remove, posts the form with `intent=remove` and `confirmed=yes`.
// Without script the form posts without `confirmed` and the server answers with the confirm page.
export async function confirmRemove(form: HTMLFormElement): Promise<boolean> {
  const { name, email } = removeTarget(form);
  return confirm({
    title: `Remove ${name}?`,
    body: removeBody(name, email),
    action: "Remove",
    returnTo: form.closest<HTMLElement>("[data-cap='people-roles']"),
    perform: async () => {
      setHidden(form, "intent", "remove");
      setHidden(form, "confirmed", "yes");
      form.submit();
    },
  });
}

function setHidden(form: HTMLFormElement, name: string, value: string): void {
  let input = form.querySelector<HTMLInputElement>(`input[type='hidden'][name='${name}']`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.append(input);
  }
  input.value = value;
}

export interface RowAction {
  // The menu item's value, posted as `intent`, or a link's key.
  value: string;
  label: string;
  href?: string;
  danger?: boolean;
}

// What a row offers: one action inline (Retry while Cloudflare has not caught up, else Renew),
// and the rest in its Actions menu. A person the viewer may not manage gets neither.
export function rowActions(
  p: Pick<PersonRow, "manageable" | "status" | "sync" | "renewTo">,
  canChangeTitle: boolean,
  changeHref: string,
  historyHref: string,
): { primary: { intent: string; label: string } | null; items: RowAction[] } {
  if (!p.manageable) return { primary: null, items: [] };
  const renew = p.status !== "removed" && p.renewTo ? { intent: "renew", label: `Renew to ${dayText(p.renewTo)}` } : null;
  const retry = p.sync !== "ready" ? { intent: "retry", label: "Retry" } : null;
  const primary = retry ?? renew;
  const items: RowAction[] = [];
  if (renew && primary !== renew) items.push({ value: renew.intent, label: renew.label });
  if (p.status === "active" && canChangeTitle) items.push({ value: "change", label: "Change title", href: changeHref });
  items.push({ value: "history", label: "History", href: historyHref });
  if (p.status !== "removed") items.push({ value: "remove", label: "Remove", danger: true });
  return { primary, items };
}

// Moves the add form's end date to the chosen title's default: its value and its latest
// allowed date, or hides the field for a title that does not expire.
export function followTitle(form: HTMLFormElement): void {
  const select = form.querySelector<HTMLSelectElement>("select[name='title']");
  const end = form.querySelector<HTMLInputElement>("input[name='end_date']");
  const field = end?.closest<HTMLElement>(".cap-field");
  const help = field?.querySelector<HTMLElement>("[data-cap-part='end-help']");
  if (!select || !end || !field) return;
  const option = select.selectedOptions[0];
  const fallback = option?.dataset.end ?? "";
  if (!fallback) {
    field.hidden = true;
    end.disabled = true;
    end.value = "";
    end.removeAttribute("max");
  } else {
    field.hidden = false;
    end.disabled = false;
    end.max = fallback;
    if (!end.value || end.value > fallback) end.value = fallback;
  }
  if (help) help.textContent = endHelp(fallback || null);
}

// Counts the review's answers into its tally line.
export function updateTally(form: HTMLFormElement): void {
  const tally = form.querySelector<HTMLElement>("[data-cap-part='tally']");
  if (!tally) return;
  let keep = 0;
  let remove = 0;
  let open = 0;
  for (const set of form.querySelectorAll<HTMLFieldSetElement>("fieldset.cap-people-review-item")) {
    const chosen = set.querySelector<HTMLInputElement>("input[type='radio']:checked");
    if (!chosen) open++;
    else if (chosen.value === "remove") remove++;
    else keep++;
  }
  tally.textContent = tallyText(keep, remove, open);
}

// Attaches to every [data-cap="people-roles"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='people-roles']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    // The add and change-title forms check their own fields (a required reason, an email).
    const fieldsOff = enhanceFields(el);
    // Each row's Actions menu: Esc, the arrow keys, closing on a press outside.
    const menusOff = enhanceMenus(el);
    for (const form of el.querySelectorAll<HTMLFormElement>("form.cap-people-add")) followTitle(form);
    for (const form of el.querySelectorAll<HTMLFormElement>("form.cap-people-review")) updateTally(form);

    const onSubmit = (e: SubmitEvent) => {
      const by = e.submitter as HTMLButtonElement | null;
      if (by?.name !== "intent" || by.value !== "remove") return;
      e.preventDefault();
      void confirmRemove(e.target as HTMLFormElement);
    };
    const onChange = (e: Event) => {
      const input = e.target as HTMLElement;
      const add = input.closest<HTMLFormElement>("form.cap-people-add");
      if (add && input.matches("select[name='title']")) followTitle(add);
      const review = input.closest<HTMLFormElement>("form.cap-people-review");
      if (review) updateTally(review);
    };
    el.addEventListener("submit", onSubmit);
    el.addEventListener("change", onChange);
    undo.push(() => {
      el.removeEventListener("submit", onSubmit);
      el.removeEventListener("change", onChange);
      fieldsOff();
      menusOff();
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
