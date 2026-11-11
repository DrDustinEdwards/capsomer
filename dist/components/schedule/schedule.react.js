import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NO_DATE, dayLabel, slotLabel, tracksLabel, zoneLine, } from "./schedule.js";
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
// The days as links: a nav landmark, the current day marked. Links, not tabs: each day has
// its own address, so the browser's Back and a shared link land on the same day.
export function ScheduleDayNav({ days, current, hrefFor, label = "Days", noDate, year = false, children, renderLink = plainLink, }) {
    if (days.length === 0 && children == null)
        return null;
    return (_jsxs("div", { className: "cap-schedule-daybar", children: [_jsx("nav", { className: "cap-schedule-daynav", "aria-label": label, children: _jsx("ul", { children: days.map((key) => (_jsx("li", { children: renderLink({
                            href: hrefFor(key),
                            className: "cap-schedule-day-link",
                            "aria-current": key === current ? "page" : undefined,
                            children: key === NO_DATE ? (dayLabel(key, { noDate })) : (_jsx("time", { dateTime: key, children: dayLabel(key, { year }) })),
                        }) }, key))) }) }), children != null && _jsx("div", { className: "cap-schedule-daybar-extra", children: children })] }));
}
function SlotTime({ slot, zone }) {
    const label = slotLabel(slot.start, slot.end, zone);
    if (slot.start === null && slot.end === null)
        return _jsx(_Fragment, { children: label });
    const iso = (t) => new Date(t).toISOString();
    const { start, end } = slot;
    if (start !== null && end !== null && end > start) {
        const [a, b] = label.split(" to ");
        return (_jsxs(_Fragment, { children: [_jsx("time", { dateTime: iso(start), children: a }), " to ", _jsx("time", { dateTime: iso(end), children: b })] }));
    }
    const at = (start ?? end);
    const [word, ...rest] = label.split(" ");
    return (_jsxs(_Fragment, { children: [word, " ", _jsx("time", { dateTime: iso(at), children: rest.join(" ") })] }));
}
// The HTML contract in schedule.md: each day a section with its heading, each slot an item of
// an ordered list with its time as the heading, parallel tracks a list of named tracks. It
// reads in time order with or without styles, and the tracks sit side by side only where they fit.
export function Schedule({ days, zone = "UTC", renderItem, keyOf, trackOf, level = 2, dayHeadings = true, zoneNote = true, idPrefix, noDate = "To be scheduled", year = false, empty = "Nothing is scheduled on this day yet.", slotFooter, }) {
    const DayH = `h${level}`;
    const slotLevel = (dayHeadings ? level + 1 : level);
    const SlotH = `h${slotLevel}`;
    const itemLevel = (slotLevel + 1);
    const first = days.flatMap((d) => d.slots).find((s) => s.start !== null)?.start ?? null;
    return (_jsxs("div", { className: "cap-schedule", children: [zoneNote && first !== null && _jsx("p", { className: "cap-schedule-zone", children: zoneLine(first, zone) }), days.map((day) => (_jsxs("section", { className: "cap-schedule-day", id: idPrefix ? `${idPrefix}${day.key}` : undefined, children: [dayHeadings && (_jsx(DayH, { className: "cap-schedule-day-title", children: day.key === NO_DATE ? (dayLabel(day.key, { noDate })) : (_jsx("time", { dateTime: day.key, children: dayLabel(day.key, { year }) })) })), day.slots.length === 0 ? (_jsx("p", { className: "cap-schedule-empty", children: empty })) : (_jsx("ol", { className: "cap-schedule-slots", children: day.slots.map((slot, i) => (_jsxs("li", { className: "cap-schedule-slot", "data-parallel": slot.parallel ? "" : undefined, children: [_jsxs("div", { className: "cap-schedule-when", children: [_jsx(SlotH, { className: "cap-schedule-time", children: _jsx(SlotTime, { slot: slot, zone: zone }) }), slot.parallel && (_jsx("p", { className: "cap-schedule-count", children: tracksLabel(slot.items.length) }))] }), _jsxs("div", { className: "cap-schedule-body", children: [slot.parallel ? (_jsx("ul", { className: "cap-schedule-tracks", role: "list", children: slot.items.map((item, n) => (_jsxs("li", { className: "cap-schedule-track", children: [_jsx("p", { className: "cap-schedule-track-name", children: trackOf?.(item) || `Track ${n + 1}` }), renderItem(item, itemLevel)] }, keyOf(item)))) })) : (slot.items.map((item) => {
                                            const track = trackOf?.(item);
                                            return (_jsxs("div", { className: "cap-schedule-track", children: [track ? _jsx("p", { className: "cap-schedule-track-name", children: track }) : null, renderItem(item, itemLevel)] }, keyOf(item)));
                                        })), slotFooter?.(slot)] })] }, slot.items[0] ? keyOf(slot.items[0]) : i))) }))] }, day.key)))] }));
}
// One session in a slot: a card with its title as a heading, its quiet facts and its contents.
export function ScheduleSession({ title, level, meta, children }) {
    const H = `h${level}`;
    return (_jsxs("article", { className: "cap-schedule-session", children: [_jsx(H, { className: "cap-schedule-session-title", children: title }), meta != null && _jsx("div", { className: "cap-schedule-session-meta", children: meta }), children] }));
}
