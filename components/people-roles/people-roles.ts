// The members page's behavior and words. Every action is a form post, so the page works with no
// script; this adds the removal confirm, the add form's end date following the title, and the
// review's tally. The rules (who may manage whom, which end dates are allowed) live in the
// server, in site-runtime's `./members`; this only shows what the server decided.

import { plural } from "@drdustinedwards/site-helpers/text";
import { listText } from "../hooks/hooks.ts";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { enhance as enhanceFields } from "../field/field.ts";
import { enhance as enhanceMenus } from "../menu/menu.ts";
import { DAY, formatDate } from "../time/time.ts";

// One person as the page shows them. The server fills `manageable` and `renewTo` from
// site-runtime's checkChange and defaultEndDate, so the page never offers what it would refuse.
export interface PersonRow {
  email: string;
  name: string;
  title: string;
  // YYYY-MM-DD in UTC, or null for a title that does not expire.
  endDate: string | null;
  status: "active" | "expired" | "removed";
  sync: "ready" | "waiting" | "failed";
  syncError?: string;
  manageable: boolean;
  // Renew sets this end date; null when the title does not expire.
  renewTo?: string | null;
  you?: boolean;
  endedOn?: string;
}

export interface TitleOption {
  value: string;
  label: string;
  defaultEnd: string | null;
}

export interface HistoryEntry {
  at: string;
  by: string;
  action: "add" | "change_title" | "renew" | "remove" | "expire" | "review_keep";
  fromTitle?: string;
  toTitle?: string;
  endDate?: string | null;
  reason?: string;
  cloudflare: "accepted" | "pending" | "failed";
  cloudflareError?: string;
}

// Days before an end date a row shows it ends soon; matches the review.
export const SOON_DAYS = 21;

export const REASON_MISSING = "Type a reason. It is recorded with the change.";

export const dayText = (date: string): string => formatDate(date, { style: "medium" }) ?? date;

export const timeText = (iso: string): string =>
  formatDate(iso, { style: "medium", time: true, zoneName: true }) ?? iso;

// Whole days from `now` until the end of the end date (0 on the end date itself).
export function daysLeft(endDate: string, now: number): number {
  return Math.floor((Date.parse(`${endDate}T00:00:00Z`) + DAY - 1 - now) / DAY);
}

export function accessText(
  p: Pick<PersonRow, "endDate" | "status" | "endedOn">,
  now: number,
): string {
  if (p.status === "removed") return p.endedOn ? `Removed ${dayText(p.endedOn)}` : "Removed";
  if (p.status === "expired") {
    const on = p.endedOn ?? p.endDate;
    return on ? `Ended ${dayText(on)}` : "Ended";
  }
  if (p.endDate === null) return "Does not expire";
  const left = daysLeft(p.endDate, now);
  if (left === 0) return `Ends today, ${dayText(p.endDate)}`;
  if (left <= SOON_DAYS) return `Ends ${dayText(p.endDate)}, in ${plural(left, "day")}`;
  return `Ends ${dayText(p.endDate)}`;
}

export function endsSoon(p: Pick<PersonRow, "endDate" | "status">, now: number): boolean {
  return p.status === "active" && p.endDate !== null && daysLeft(p.endDate, now) <= SOON_DAYS;
}

// A removed or expired person is "Ready" once Cloudflare has taken them off.
export function syncText(p: Pick<PersonRow, "sync" | "status">): string {
  if (p.sync === "waiting") return "Waiting for Cloudflare";
  if (p.sync === "failed") return "Cloudflare refused";
  return p.status === "active" ? "Ready: they can sign in" : "Ready: signed out";
}

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

export function endHelp(defaultEnd: string | null): string {
  return defaultEnd
    ? `Defaults to the end of the term, ${dayText(defaultEnd)}. You can choose an earlier date.`
    : "This title does not expire.";
}

export function tallyText(keep: number, remove: number, open: number): string {
  const parts = [`${keep} to keep`, `${remove} to remove`];
  if (open) parts.push(`${open} not answered`);
  return `${parts.join(", ")}.`;
}

function removeBody(name: string, email: string): string[] {
  return [
    `${name} is refused on their next request.`,
    `${email} comes off the allow list and their Cloudflare seat is freed.`,
    "Their row stays, marked removed, so their work keeps their name.",
  ];
}

function removeTarget(form: HTMLFormElement): { name: string; email: string } {
  const row = form.closest<HTMLElement>("tr[data-email]");
  const email =
    row?.dataset.email ??
    form.dataset.email ??
    (form.elements.namedItem("email") as HTMLInputElement | null)?.value ??
    "";
  return { name: row?.dataset.name ?? form.dataset.name ?? email, email };
}

// Without script the form posts without `confirmed` and the server answers with the confirm page.
// An app that posts the removal itself passes `perform`.
export async function confirmRemove(
  form: HTMLFormElement,
  perform: () => Promise<void> = async () => {
    setHidden(form, "intent", "remove");
    setHidden(form, "confirmed", "yes");
    form.submit();
  },
): Promise<boolean> {
  const { name, email } = removeTarget(form);
  return confirm({
    title: `Remove ${name}?`,
    body: removeBody(name, email),
    action: "Remove",
    returnTo: form.closest<HTMLElement>("[data-cap='people-roles']"),
    perform,
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
  value: string;
  label: string;
  href?: string;
  danger?: boolean;
}

// One action inline (Retry while Cloudflare has not caught up, else Renew), the rest in the Actions menu.
export function rowActions(
  p: Pick<PersonRow, "manageable" | "status" | "sync" | "renewTo">,
  canChangeTitle: boolean,
  changeHref: string,
  historyHref: string,
): { primary: { intent: string; label: string } | null; items: RowAction[] } {
  if (!p.manageable) return { primary: null, items: [] };
  const renew =
    p.status !== "removed" && p.renewTo
      ? { intent: "renew", label: `Renew to ${dayText(p.renewTo)}` }
      : null;
  const retry = p.sync !== "ready" ? { intent: "retry", label: "Retry" } : null;
  const primary = retry ?? renew;
  const items: RowAction[] = [];
  if (renew && primary !== renew) items.push({ value: renew.intent, label: renew.label });
  if (p.status === "active" && canChangeTitle)
    items.push({ value: "change", label: "Change title", href: changeHref });
  items.push({ value: "history", label: "History", href: historyHref });
  if (p.status !== "removed") items.push({ value: "remove", label: "Remove", danger: true });
  return { primary, items };
}

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

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='people-roles']:not([data-cap-ready])",
  )) {
    el.dataset.capReady = "";
    const fieldsOff = enhanceFields(el);
    const menusOff = enhanceMenus(el);
    for (const form of el.querySelectorAll<HTMLFormElement>("form.cap-people-add"))
      followTitle(form);
    for (const form of el.querySelectorAll<HTMLFormElement>("form.cap-people-review"))
      updateTally(form);

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

// "Lab worker" is "Lab workers"; a title already plural stays.
export function pluralTitle(label: string): string {
  return label.endsWith("s") ? label : `${label}s`;
}

// "You manage Lab workers and Lab managers.", titles highest first. `notice` follows when something
// must be set up first. Undefined when the viewer gives no title.
export function manageLead(titles: readonly string[], notice?: string): string | undefined {
  if (titles.length === 0) return undefined;
  return `You manage ${listText(titles.map(pluralTitle))}.${notice ? ` ${notice}` : ""}`;
}

// Anything else names nobody, so an address can never show a person the page would not list.
export function personFromParam(
  params: URLSearchParams,
  name: "person" | "change",
  emails: readonly string[],
  allowed: (email: string) => boolean = () => true,
): string | undefined {
  const asked = params.get(name)?.trim().toLowerCase();
  if (!asked) return undefined;
  return emails.some((e) => e.toLowerCase() === asked) && allowed(asked) ? asked : undefined;
}

export interface RoleScope {
  id: string;
  name: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

export interface RoleGridPerson {
  id: string;
  email: string;
  name?: string;
  // Each scope's role value; a scope that is absent is "" (no access).
  roles: Readonly<Record<string, string>>;
  badges?: string[];
  disabledAt?: string;
  // A person whose roles are not set here (the Owner): this sentence spans the scopes, and the
  // row has no Save and no Disable.
  everyScope?: string;
}

export function roleSavedText(person: string, scope: string, role: string): string {
  return `Saved: ${person} on ${scope}, ${role}.`;
}

export function roleFailedText(person: string, scope: string): string {
  return `Not saved: ${person} on ${scope}. The role is back to what it was.`;
}

export function personName(p: Pick<RoleGridPerson, "name" | "email">): string {
  return p.name || p.email;
}
