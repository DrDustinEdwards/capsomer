import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The parts around a track's player: its chapters as a list, its key moments, its hosts, and the
// inline audio button that plays a short clip inside running text.
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "../avatar/avatar.react.js";
import { reducedMotion } from "../hooks/hooks.js";
import { activeChapterIndex, enhance, formatTime, } from "./player.js";
import { usePlayer } from "./player-context.react.js";
// Seeks the loaded track, or loads this one at that time.
function useSeekTrack(track) {
    const p = usePlayer();
    const active = p.current?.id === track.id;
    return {
        now: active ? p.currentTime : -1,
        go: (seconds) => (active ? p.seek(seconds) : p.playTrackAt(track, seconds)),
    };
}
// Every chapter, the one playing marked (aria-current) and a press seeks to it.
export function ChapterList({ track, chapters, heading = "Chapters", level = 2, }) {
    const list = chapters ?? track.chapters ?? [];
    const { now, go } = useSeekTrack(track);
    const id = useId();
    if (!list.length)
        return null;
    const cur = now < 0 ? -1 : activeChapterIndex(list, now);
    const H = level === 3 ? "h3" : "h2";
    return (_jsxs("section", { className: "cap-player-list", "aria-labelledby": id, children: [_jsx(H, { className: "cap-player-list-heading", id: id, children: heading }), _jsx("ol", { className: "cap-player-chapters", children: list.map((c, i) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-player-chapter", "aria-current": i === cur ? "true" : undefined, onClick: () => go(c.start), children: [_jsx("span", { className: "cap-player-at", children: formatTime(c.start) }), _jsx("span", { className: "cap-player-chapter-title", children: c.title })] }) }, `${c.start}-${c.title}`))) })] }));
}
// The moments worth jumping to, as a grid of time and label. A press seeks there, brings the player
// into view, and says where it went in a status line under the list (in the page, not a toast).
export function KeyMoments({ track, moments, heading = "Key moments", level = 2, playerId, }) {
    const { now, go } = useSeekTrack(track);
    const [said, setSaid] = useState("");
    const timer = useRef(undefined);
    const id = useId();
    useEffect(() => () => window.clearTimeout(timer.current), []);
    if (!moments.length)
        return null;
    const H = level === 3 ? "h3" : "h2";
    return (_jsxs("section", { className: "cap-player-list", "aria-labelledby": id, children: [_jsx(H, { className: "cap-player-list-heading", id: id, children: heading }), _jsx("ol", { className: "cap-player-moments", children: moments.map((m, i) => {
                    const nextAt = moments[i + 1]?.seconds ?? Infinity;
                    const on = now >= m.seconds && now < nextAt;
                    return (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-player-moment", "aria-current": on ? "true" : undefined, onClick: () => {
                                go(m.seconds);
                                if (playerId)
                                    document.getElementById(playerId)?.scrollIntoView({
                                        behavior: reducedMotion() ? "auto" : "smooth",
                                        block: "center",
                                    });
                                setSaid(`Jumped to ${formatTime(m.seconds)}`);
                                window.clearTimeout(timer.current);
                                timer.current = window.setTimeout(() => setSaid(""), 1800);
                            }, children: [_jsx("span", { className: "cap-player-at", children: formatTime(m.seconds) }), _jsx("span", { className: "cap-player-moment-label", children: m.label })] }) }, `${m.seconds}-${m.label}`));
                }) }), _jsx("p", { className: "cap-player-said", role: "status", children: said })] }));
}
// Who hosts it: a picture, the name (linked to their own page) and their role.
export function Hosts({ hosts, heading = "Hosts", level = 2, avatar }) {
    const id = useId();
    if (!hosts.length)
        return null;
    const H = level === 3 ? "h3" : "h2";
    return (_jsxs("section", { className: "cap-player-list", "aria-labelledby": id, children: [_jsx(H, { className: "cap-player-list-heading", id: id, children: heading }), _jsx("ul", { className: "cap-player-hosts", children: hosts.map((h) => (_jsxs("li", { className: "cap-player-host", children: [avatar ? avatar(h) : _jsx(Avatar, { name: h.name, src: h.img, size: "lg" }), _jsxs("span", { className: "cap-player-host-text", children: [h.href ? (_jsx("a", { className: "cap-player-host-name", href: h.href, rel: "me", children: h.name })) : (_jsx("span", { className: "cap-player-host-name", children: h.name })), h.role ? _jsx("span", { className: "cap-player-meta", children: h.role }) : null] })] }, h.name))) })] }));
}
// A speaker with two sound waves; the waves carry the playing state in CSS.
const SpeakerIcon = () => (_jsxs("svg", { className: "cap-player-clip-icon", viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4z", fill: "currentColor" }), _jsx("path", { className: "cap-player-clip-wave", d: "M15 9.2a4 4 0 0 1 0 5.6", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { className: "cap-player-clip-wave", "data-wave": "2", d: "M17.6 6.6a7.6 7.6 0 0 1 0 10.8", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
// The inline audio button. The markup is complete with no script (a link to the clip); the behavior
// module shows the button and plays the clip in place. Playing is the element's own state
// (aria-pressed, set by the module), as the popover's open state is, not React state.
export function PlayClip({ src, label }) {
    const root = useRef(null);
    useEffect(() => (root.current ? enhance(root.current) : undefined), []);
    return (_jsxs("span", { ref: root, className: "cap-player-clip", "data-cap": "player", "data-kind": "clip", children: [_jsx("a", { className: "cap-player-clip-link", href: src, "aria-label": label, children: _jsx(SpeakerIcon, {}) }), _jsx("button", { type: "button", className: "cap-player-clip-button", "data-src": src, "aria-label": label, "aria-pressed": "false", hidden: true, children: _jsx(SpeakerIcon, {}) })] }));
}
