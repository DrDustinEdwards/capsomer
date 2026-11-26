// The members page's behavior and words. Every action is a form post, so the page works with no
// script; this adds the removal confirm, the add form's end date following the title, and the
// review's tally. The rules (who may manage whom, which end dates are allowed) live in the
// server, in site-runtime's `./members`; this only shows what the server decided.
import { plural } from "@drdustinedwards/site-helpers/text";
import { listText } from "../hooks/hooks.js";
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { enhance as enhanceFields } from "../field/field.js";
import { enhance as enhanceMenus } from "../menu/menu.js";
import { DAY, formatDate } from "../time/time.js";
// Days before an end date a row shows it ends soon; matches the review.
export const SOON_DAYS = 21;
export const REASON_MISSING = "Type a reason. It is recorded with the change.";
export const dayText = (date) => formatDate(date, { style: "medium" }) ?? date;
export const timeText = (iso) => formatDate(iso, { style: "medium", time: true, zoneName: true }) ?? iso;
// Whole days from `now` until the end of the end date (0 on the end date itself).
export function daysLeft(endDate, now) {
    return Math.floor((Date.parse(`${endDate}T00:00:00Z`) + DAY - 1 - now) / DAY);
}
export function accessText(p, now) {
    if (p.status === "removed")
        return p.endedOn ? `Removed ${dayText(p.endedOn)}` : "Removed";
    if (p.status === "expired") {
        const on = p.endedOn ?? p.endDate;
        return on ? `Ended ${dayText(on)}` : "Ended";
    }
    if (p.endDate === null)
        return "Does not expire";
    const left = daysLeft(p.endDate, now);
    if (left === 0)
        return `Ends today, ${dayText(p.endDate)}`;
    if (left <= SOON_DAYS)
        return `Ends ${dayText(p.endDate)}, in ${plural(left, "day")}`;
    return `Ends ${dayText(p.endDate)}`;
}
export function endsSoon(p, now) {
    return p.status === "active" && p.endDate !== null && daysLeft(p.endDate, now) <= SOON_DAYS;
}
// A removed or expired person is "Ready" once Cloudflare has taken them off.
export function syncText(p) {
    if (p.sync === "waiting")
        return "Waiting for Cloudflare";
    if (p.sync === "failed")
        return "Cloudflare refused";
    return p.status === "active" ? "Ready: they can sign in" : "Ready: signed out";
}
export function actionText(e) {
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
export function cloudflareText(e) {
    if (e.cloudflare === "accepted")
        return "Cloudflare accepted";
    if (e.cloudflare === "pending")
        return "Waiting for Cloudflare";
    return e.cloudflareError ? `Cloudflare refused: ${e.cloudflareError}` : "Cloudflare refused";
}
export function endHelp(defaultEnd) {
    return defaultEnd
        ? `Defaults to the end of the term, ${dayText(defaultEnd)}. You can choose an earlier date.`
        : "This title does not expire.";
}
export function tallyText(keep, remove, open) {
    const parts = [`${keep} to keep`, `${remove} to remove`];
    if (open)
        parts.push(`${open} not answered`);
    return `${parts.join(", ")}.`;
}
function removeBody(name, email) {
    return [
        `${name} is refused on their next request.`,
        `${email} comes off the allow list and their Cloudflare seat is freed.`,
        "Their row stays, marked removed, so their work keeps their name.",
    ];
}
function removeTarget(form) {
    const row = form.closest("tr[data-email]");
    const email = row?.dataset.email ??
        form.dataset.email ??
        form.elements.namedItem("email")?.value ??
        "";
    return { name: row?.dataset.name ?? form.dataset.name ?? email, email };
}
// Without script the form posts without `confirmed` and the server answers with the confirm page.
// An app that posts the removal itself passes `perform`.
export async function confirmRemove(form, perform = async () => {
    setHidden(form, "intent", "remove");
    setHidden(form, "confirmed", "yes");
    form.submit();
}) {
    const { name, email } = removeTarget(form);
    return confirm({
        title: `Remove ${name}?`,
        body: removeBody(name, email),
        action: "Remove",
        returnTo: form.closest("[data-cap='people-roles']"),
        perform,
    });
}
function setHidden(form, name, value) {
    let input = form.querySelector(`input[type='hidden'][name='${name}']`);
    if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.append(input);
    }
    input.value = value;
}
// One action inline (Retry while Cloudflare has not caught up, else Renew), the rest in the Actions menu.
export function rowActions(p, canChangeTitle, changeHref, historyHref) {
    if (!p.manageable)
        return { primary: null, items: [] };
    const renew = p.status !== "removed" && p.renewTo
        ? { intent: "renew", label: `Renew to ${dayText(p.renewTo)}` }
        : null;
    const retry = p.sync !== "ready" ? { intent: "retry", label: "Retry" } : null;
    const primary = retry ?? renew;
    const items = [];
    if (renew && primary !== renew)
        items.push({ value: renew.intent, label: renew.label });
    if (p.status === "active" && canChangeTitle)
        items.push({ value: "change", label: "Change title", href: changeHref });
    items.push({ value: "history", label: "History", href: historyHref });
    if (p.status !== "removed")
        items.push({ value: "remove", label: "Remove", danger: true });
    return { primary, items };
}
export function followTitle(form) {
    const select = form.querySelector("select[name='title']");
    const end = form.querySelector("input[name='end_date']");
    const field = end?.closest(".cap-field");
    const help = field?.querySelector("[data-cap-part='end-help']");
    if (!select || !end || !field)
        return;
    const option = select.selectedOptions[0];
    const fallback = option?.dataset.end ?? "";
    if (!fallback) {
        field.hidden = true;
        end.disabled = true;
        end.value = "";
        end.removeAttribute("max");
    }
    else {
        field.hidden = false;
        end.disabled = false;
        end.max = fallback;
        if (!end.value || end.value > fallback)
            end.value = fallback;
    }
    if (help)
        help.textContent = endHelp(fallback || null);
}
export function updateTally(form) {
    const tally = form.querySelector("[data-cap-part='tally']");
    if (!tally)
        return;
    let keep = 0;
    let remove = 0;
    let open = 0;
    for (const set of form.querySelectorAll("fieldset.cap-people-review-item")) {
        const chosen = set.querySelector("input[type='radio']:checked");
        if (!chosen)
            open++;
        else if (chosen.value === "remove")
            remove++;
        else
            keep++;
    }
    tally.textContent = tallyText(keep, remove, open);
}
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='people-roles']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        const fieldsOff = enhanceFields(el);
        const menusOff = enhanceMenus(el);
        for (const form of el.querySelectorAll("form.cap-people-add"))
            followTitle(form);
        for (const form of el.querySelectorAll("form.cap-people-review"))
            updateTally(form);
        const onSubmit = (e) => {
            const by = e.submitter;
            if (by?.name !== "intent" || by.value !== "remove")
                return;
            e.preventDefault();
            void confirmRemove(e.target);
        };
        const onChange = (e) => {
            const input = e.target;
            const add = input.closest("form.cap-people-add");
            if (add && input.matches("select[name='title']"))
                followTitle(add);
            const review = input.closest("form.cap-people-review");
            if (review)
                updateTally(review);
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
export function pluralTitle(label) {
    return label.endsWith("s") ? label : `${label}s`;
}
// "You manage Lab workers and Lab managers.", titles highest first. `notice` follows when something
// must be set up first. Undefined when the viewer gives no title.
export function manageLead(titles, notice) {
    if (titles.length === 0)
        return undefined;
    return `You manage ${listText(titles.map(pluralTitle))}.${notice ? ` ${notice}` : ""}`;
}
// Anything else names nobody, so an address can never show a person the page would not list.
export function personFromParam(params, name, emails, allowed = () => true) {
    const asked = params.get(name)?.trim().toLowerCase();
    if (!asked)
        return undefined;
    return emails.some((e) => e.toLowerCase() === asked) && allowed(asked) ? asked : undefined;
}
export function roleSavedText(person, scope, role) {
    return `Saved: ${person} on ${scope}, ${role}.`;
}
export function roleFailedText(person, scope) {
    return `Not saved: ${person} on ${scope}. The role is back to what it was.`;
}
export function personName(p) {
    return p.name || p.email;
}
