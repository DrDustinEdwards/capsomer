// A form described as data: one FieldSpec per field, which the React part draws and readSpecs
// reads back from a post, checked against the same spec. Safe on the server: no DOM.
import { parseMoneyInput } from "@dustinedwards/site-runtime/money";
import { dateFrom, fromDateTimeLocal } from "../field/field.js";
// The control's id for a field key, so an error summary's link and a "needs info" link land on it.
export const specId = (key, prefix = "field") => `${prefix}-${key.replace(/[^A-Za-z0-9_-]/g, "-")}`;
// A JSON value posted in one field (a hidden input an editor fills), or null when it is
// missing, does not parse, or does not pass `valid`. Null, never a fallback: an action that
// saved [] for a broken field would erase what is stored.
export function parseJsonField(raw, valid = (_v) => true) {
    if (typeof raw !== "string")
        return null;
    try {
        const parsed = JSON.parse(raw);
        return valid(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const words = (label) => label.charAt(0).toLowerCase() + label.slice(1);
// One field's value from a post, and the message when it does not do. Values: a string (text,
// email, url, textarea, date, select, choice), string[] (lines, multi), number (number, money in
// cents), boolean (checkbox), Date (datetime), unknown (json), or undefined for an empty field.
// A kind it does not know is read as text.
export function readSpec(form, spec) {
    const raw = form.get(spec.key);
    const text = typeof raw === "string" ? raw.trim() : "";
    const need = (v, empty) => empty && spec.required ? { value: v, error: `Enter ${words(spec.label)}.` } : { value: v };
    switch (spec.kind) {
        case "readonly":
            return { value: undefined };
        case "checkbox":
            return { value: raw !== null };
        case "multi": {
            const all = form.getAll(spec.key).filter((v) => typeof v === "string");
            const known = spec.options
                ? all.filter((v) => spec.options.some((o) => o.value === v))
                : all;
            return known.length || !spec.required
                ? { value: known.length ? known : undefined }
                : { value: undefined, error: `Choose at least one ${words(spec.label)}.` };
        }
        case "lines": {
            const lines = text
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
            return need(lines.length ? lines : undefined, !lines.length);
        }
        case "number": {
            if (!text)
                return need(undefined, true);
            const n = Number(text);
            if (!Number.isFinite(n))
                return { value: undefined, error: `${spec.label} must be a number.` };
            if (spec.min !== undefined && n < spec.min)
                return { value: n, error: `${spec.label} must be ${spec.min} or more.` };
            if (spec.max !== undefined && n > spec.max)
                return { value: n, error: `${spec.label} must be ${spec.max} or less.` };
            return { value: n };
        }
        case "money": {
            if (!text)
                return need(undefined, true);
            const cents = parseMoneyInput(text, "usd");
            return cents === null
                ? {
                    value: undefined,
                    error: `${spec.label} must be an amount in dollars, such as 25 or 12.50.`,
                }
                : { value: cents };
        }
        case "datetime": {
            if (!text)
                return need(undefined, true);
            const at = fromDateTimeLocal(text, spec.timeZone);
            return at
                ? { value: at }
                : { value: undefined, error: `${spec.label} must be a real date and time.` };
        }
        case "date": {
            if (!text)
                return need(undefined, true);
            const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
            return ymd && dateFrom(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]))
                ? { value: text }
                : { value: undefined, error: `${spec.label} must be a real date.` };
        }
        case "select":
        case "choice": {
            if (!text)
                return need(undefined, true);
            return !spec.options || spec.options.some((o) => o.value === text)
                ? { value: text }
                : { value: undefined, error: `Choose ${words(spec.label)} from the list.` };
        }
        case "email":
            if (!text)
                return need(undefined, true);
            return EMAIL.test(text)
                ? { value: text }
                : { value: text, error: `Enter an email address, like name@example.com.` };
        case "url": {
            if (!text)
                return need(undefined, true);
            try {
                const u = new URL(text);
                if (u.protocol === "https:" || u.protocol === "http:")
                    return { value: text };
            }
            catch {
                /* falls through to the error */
            }
            return { value: text, error: `${spec.label} must be a full address starting https://.` };
        }
        case "json": {
            if (!text)
                return need(undefined, true);
            const parsed = parseJsonField(text);
            return parsed === null
                ? { value: undefined, error: `${spec.label} is not valid JSON.` }
                : { value: parsed };
        }
        default:
            return need(text || undefined, !text);
    }
}
// Every field of a post by its spec: the values by key (an empty field is left out) and the
// errors in the form's order, for the error summary and the message beside each field.
export function readSpecs(form, specs) {
    const values = {};
    const errors = [];
    for (const spec of specs) {
        const { value, error } = readSpec(form, spec);
        if (value !== undefined)
            values[spec.key] = value;
        if (error)
            errors.push({ key: spec.key, text: error });
    }
    return { values, errors };
}
