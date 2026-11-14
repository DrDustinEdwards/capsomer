import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The line above a file's text in its room: who else is in it, each in the color of their caret,
// whether this page is connected, and for someone who may edit, Editing or Suggesting.
import { listText } from "../hooks/hooks.js";
import { Avatar, AvatarGroup } from "../avatar/avatar.react.js";
import { Segmented } from "../segmented/segmented.react.js";
import { Status } from "../status/status.react.js";
import { personSlot } from "./collab-editor-room.js";
/** One entry per person, however many tabs they have open, without this page's own connection. */
function othersIn(people, me) {
    const seen = new Map();
    for (const p of people)
        if (p.id !== me && !seen.has(p.id))
            seen.set(p.id, p);
    return [...seen.values()];
}
export function RoomBar({ people, me, status, mayEdit, mode, onMode, pending, }) {
    const others = othersIn(people, me);
    const names = others.map((p) => p.name);
    return (_jsxs("div", { className: "cap-collab-bar", children: [_jsxs("div", { className: "cap-collab-people", children: [others.length > 0 ? (_jsx(AvatarGroup, { label: `Also here: ${listText(names)}`, children: others.map((p) => (_jsx("span", { className: "cap-collab-person", "data-who": personSlot(p.id), children: _jsx(Avatar, { name: p.name, size: "sm" }) }, p.id))) })) : null, _jsx("p", { className: "cap-collab-line", role: "status", children: status === "offline" ? (_jsxs(_Fragment, { children: [_jsx(Status, { tone: "warn", children: "Offline" }), " Your changes are kept here and sent when the connection is back."] })) : status === "connecting" ? (_jsx(Status, { tone: "nodata", running: true, children: "Connecting" })) : others.length === 0 ? ("Only you are here.") : (`${listText(names)} ${others.length === 1 ? "is" : "are"} here too.`) })] }), mayEdit ? (_jsx(Segmented, { legend: "Changes you make", hideLegend: true, size: "sm", value: mode, onChange: onMode, options: [
                    { value: "edit", label: "Editing" },
                    { value: "suggest", label: "Suggesting" },
                ] })) : (_jsxs("p", { className: "cap-collab-note", children: ["You are suggesting: what you type shows as a suggestion until an editor accepts it.", pending > 0 ? ` ${pending} waiting.` : ""] }))] }));
}
