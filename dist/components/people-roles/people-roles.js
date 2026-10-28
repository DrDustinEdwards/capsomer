// The members page's behavior and the words it shows. Every action is a form post, so the
// page works with no script; this module adds what a form cannot do alone: the confirm
// before a removal, the add form's end date following the chosen title, and the review's
// running tally. The rules (who may manage whom, what may be granted, which end dates are
// allowed) live in the app's server, in site-runtime's `./members`; this module only shows
// what the server already decided.
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { enhance as enhanceFields } from "../field/field.js";
import { enhance as enhanceMenus } from "../menu/menu.js";
import { DAY } from "../time/time.js";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// How long before an end date the row shows that it ends soon, matching the review (21 days).
export const SOON_DAYS = 21;
export const REASON_MISSING = "Type a reason. It is recorded with the change.";
// "18 Dec 2026", from a YYYY-MM-DD date, in UTC.
export function dayText(date) {
    const t = new Date(`${date}T00:00:00Z`);
    return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}
// "2 Oct 2026, 14:52 UTC", from an ISO time.
export function timeText(iso) {
    const t = new Date(iso);
    const hh = String(t.getUTCHours()).padStart(2, "0");
    const mm = String(t.getUTCMinutes()).padStart(2, "0");
    return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}, ${hh}:${mm} UTC`;
}
// Whole days from `now` until the end of the end date (0 on the end date itself).
export function daysLeft(endDate, now) {
    return Math.floor((Date.parse(`${endDate}T00:00:00Z`) + DAY - 1 - now) / DAY);
}
// The Access column's words.
export function accessText(p, now) {
    if (p.status === "removed")
        return p.endedOn ? `Removed ${dayText(p.endedOn)}` : "Removed";
    if (p.status === "expired")
        return `Ended ${dayText(p.endedOn ?? p.endDate)}`;
    if (p.endDate === null)
        return "Does not expire";
    const left = daysLeft(p.endDate, now);
    if (left === 0)
        return `Ends today, ${dayText(p.endDate)}`;
    if (left <= SOON_DAYS)
        return `Ends ${dayText(p.endDate)}, in ${left} day${left === 1 ? "" : "s"}`;
    return `Ends ${dayText(p.endDate)}`;
}
// Whether the end date is close enough to mark (the review is open).
export function endsSoon(p, now) {
    return p.status === "active" && p.endDate !== null && daysLeft(p.endDate, now) <= SOON_DAYS;
}
// The Cloudflare column's words. A removed or expired person is "Ready" once Cloudflare has
// taken them off, so the column always answers "does Cloudflare match this row yet".
export function syncText(p) {
    if (p.sync === "waiting")
        return "Waiting for Cloudflare";
    if (p.sync === "failed")
        return "Cloudflare refused";
    return p.status === "active" ? "Ready: they can sign in" : "Ready: signed out";
}
// One history line's words.
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
// The add form's help line under the end date.
export function endHelp(defaultEnd) {
    return defaultEnd ? `Defaults to the end of the term, ${dayText(defaultEnd)}. You can choose an earlier date.` : "This title does not expire.";
}
// The review's running count.
export function tallyText(keep, remove, open) {
    const parts = [`${keep} to keep`, `${remove} to remove`];
    if (open)
        parts.push(`${open} not answered`);
    return `${parts.join(", ")}.`;
}
// The removal's confirm, from the server's own words: who, and what follows.
export function removeBody(name, email) {
    return [`${name} is refused on their next request.`, `${email} comes off the allow list and their Cloudflare seat is freed.`, "Their row stays, marked removed, so their work keeps their name."];
}
// Who a removal is for, from the row the form sits in (or the form's own data).
export function removeTarget(form) {
    const row = form.closest("tr[data-email]");
    const email = row?.dataset.email ?? form.dataset.email ?? form.elements.namedItem("email")?.value ?? "";
    return { name: row?.dataset.name ?? form.dataset.name ?? email, email };
}
// Asks before a removal; on Remove, posts the form with `intent=remove` and `confirmed=yes`.
// Without script the form posts without `confirmed` and the server answers with the confirm page.
export async function confirmRemove(form) {
    const { name, email } = removeTarget(form);
    return confirm({
        title: `Remove ${name}?`,
        body: removeBody(name, email),
        action: "Remove",
        returnTo: form.closest("[data-cap='people-roles']"),
        perform: async () => {
            setHidden(form, "intent", "remove");
            setHidden(form, "confirmed", "yes");
            form.submit();
        },
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
// What a row offers: one action inline (Retry while Cloudflare has not caught up, else Renew),
// and the rest in its Actions menu. A person the viewer may not manage gets neither.
export function rowActions(p, canChangeTitle, changeHref, historyHref) {
    if (!p.manageable)
        return { primary: null, items: [] };
    const renew = p.status !== "removed" && p.renewTo ? { intent: "renew", label: `Renew to ${dayText(p.renewTo)}` } : null;
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
// Moves the add form's end date to the chosen title's default: its value and its latest
// allowed date, or hides the field for a title that does not expire.
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
// Counts the review's answers into its tally line.
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
// Attaches to every [data-cap="people-roles"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='people-roles']:not([data-cap-ready])")) {
        el.dataset.capReady = "";
        // The add and change-title forms check their own fields (a required reason, an email).
        const fieldsOff = enhanceFields(el);
        // Each row's Actions menu: Esc, the arrow keys, closing on a press outside.
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
