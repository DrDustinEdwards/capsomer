import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { clamp } from "../hooks/hooks.js";
import { Icon, iconCaptions, iconFastForward, iconPause, iconPlay, iconRewind, iconSkipNext, } from "../icons/icons.react.js";
import { Range } from "../field/field.react.js";
import { plainLink } from "../hooks/hooks.react.js";
import { activeChapterIndex, formatTime, spokenTime } from "./player.js";
import { usePlayer } from "./player-context.react.js";
// Icons, from the shared set. Each is aria-hidden; the control carries the name. player.css sizes
// them (.cap-player-icon) and draws them at the player's stroke.
const PlayIcon = () => _jsx(Icon, { d: iconPlay, fill: true, className: "cap-player-icon" });
const PauseIcon = () => _jsx(Icon, { d: iconPause, fill: true, className: "cap-player-icon" });
// Whether a control aimed at `track` acts on what is loaded.
function useTarget(track) {
    const p = usePlayer();
    const isThis = !track || p.current?.id === track.id;
    return { p, isThis };
}
// Transport.
// Play and pause: the name changes with the state and there is no aria-pressed (APG Button: one,
// not both).
export function PlayPauseButton({ track, size = "md", }) {
    const { p, isThis } = useTarget(track);
    const playing = isThis && p.isPlaying;
    return (_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "play", "data-state": playing ? "playing" : undefined, "data-size": size === "lg" ? "lg" : undefined, "aria-label": playing ? "Pause" : "Play", onClick: () => (isThis ? p.toggle() : track && p.playTrack(track)), children: playing ? _jsx(PauseIcon, {}) : _jsx(PlayIcon, {}) }));
}
export function SkipButton({ delta, track }) {
    const { p, isThis } = useTarget(track);
    const back = delta < 0;
    const secs = Math.abs(delta);
    return (_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "skip", "aria-label": back ? `Rewind ${secs} seconds` : `Skip forward ${secs} seconds`, onClick: () => (isThis ? p.skip(delta) : track && p.playTrackAt(track, Math.max(0, delta))), children: _jsx(Icon, { d: back ? iconRewind : iconFastForward, className: "cap-player-icon" }) }));
}
export function NextButton() {
    const p = usePlayer();
    return (_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "next", "aria-label": `Next ${p.noun}`, disabled: p.index >= p.queue.length - 1, onClick: p.next, children: _jsx(Icon, { d: iconSkipNext, className: "cap-player-icon" }) }));
}
// Plays a track from a listing. With a queue it starts the whole queue at this track, so play goes
// on to the next. data-play-intent, data-audio-src and data-track-id let a page with no React yet
// start the press itself (startTrack in player.ts) and hand it to this button once React is live.
export function PlayTrackButton({ track, queue, size = "md", }) {
    const p = usePlayer();
    const isCurrent = p.current?.id === track.id;
    const playing = isCurrent && p.isPlaying;
    return (_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "play", "data-state": playing ? "playing" : undefined, "data-size": size === "md" ? undefined : size, "data-play-intent": "", "data-audio-src": track.src, "data-track-id": track.id, "aria-label": `${playing ? "Pause" : "Play"} ${track.title}`, onClick: () => {
            if (isCurrent)
                return p.toggle();
            if (queue?.length) {
                const i = queue.findIndex((t) => t.id === track.id);
                p.playQueueAt(queue, i >= 0 ? i : 0);
            }
            else
                p.playTrack(track);
        }, children: playing ? _jsx(PauseIcon, {}) : _jsx(PlayIcon, {}) }));
}
// The seek control: a native range with its own keys (no drag needed, WCAG 2.5.7), the time spoken
// in aria-valuetext, the time and length beside it, and chapter ticks on the track.
export function Scrubber({ track, ticks = false }) {
    const { p, isThis } = useTarget(track);
    const dur = (isThis ? p.duration : 0) || track?.duration || p.current?.duration || 0;
    const pos = isThis ? p.currentTime : 0;
    const chapters = (isThis ? (track ?? p.current)?.chapters : track?.chapters) ?? [];
    const seekTo = (s) => {
        const to = clamp(s, 0, dur || s);
        if (isThis)
            p.seek(to);
        else if (track)
            p.playTrackAt(track, to);
    };
    const onKey = (e) => {
        const step = e.shiftKey ? 15 : 5;
        const to = e.key === "ArrowLeft" || e.key === "ArrowDown"
            ? pos - step
            : e.key === "ArrowRight" || e.key === "ArrowUp"
                ? pos + step
                : e.key === "PageDown"
                    ? pos - 60
                    : e.key === "PageUp"
                        ? pos + 60
                        : e.key === "Home"
                            ? 0
                            : e.key === "End"
                                ? dur
                                : null;
        if (to === null)
            return;
        e.preventDefault();
        seekTo(to);
    };
    return (_jsxs("div", { className: "cap-player-scrubber", children: [_jsx("span", { className: "cap-player-time", children: formatTime(pos) }), _jsxs("span", { className: "cap-player-track", children: [_jsx(Range, { className: "cap-player-seek", min: 0, max: dur || 1, step: 1, value: Math.min(pos, dur || 1), disabled: !dur, "aria-label": "Seek", "aria-valuetext": `${spokenTime(pos)} of ${spokenTime(dur)}`, onChange: (e) => seekTo(Number(e.target.value)), onKeyDown: onKey }), ticks && dur > 0 && chapters.length ? (_jsx("svg", { className: "cap-player-ticks", viewBox: "0 0 100 10", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false", children: chapters.map((c) => {
                            const x = Math.min(100, (c.start / dur) * 100);
                            return _jsx("line", { x1: x, x2: x, y1: "0", y2: "10" }, `${c.start}-${c.title}`);
                        }) })) : null] }), _jsx("span", { className: "cap-player-time", children: formatTime(dur) })] }));
}
// The way to the read-along transcript: `href` (the track's transcript, or "#transcript" on its
// own page), through the app's router link.
export function TranscriptLink({ href, renderLink = plainLink, }) {
    return renderLink({
        href,
        className: "cap-player-btn cap-player-transcript-link",
        children: (_jsxs(_Fragment, { children: [_jsx(Icon, { d: iconCaptions, className: "cap-player-icon" }), " Transcript"] })),
    });
}
// The player's state in words for a screen reader, politely: rendered once (in the dock) so it is
// never said twice, and outside anything the dock hides.
export function PlayerStatus() {
    const p = usePlayer();
    const chapters = p.current?.chapters ?? [];
    const idx = activeChapterIndex(chapters, p.currentTime);
    const chap = idx >= 0 ? chapters[idx] : null;
    const status = !p.current
        ? ""
        : p.errored
            ? "Error loading audio"
            : p.buffering
                ? "Buffering"
                : p.isPlaying
                    ? `Playing${chap ? `, ${chap.title}` : ""}`
                    : "Paused";
    return (_jsx("div", { className: "cap-sr-only", "aria-live": "polite", children: status }));
}
