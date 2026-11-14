import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// The player's controls, one set for the docked player and a track's own player surface, so both
// offer the same capability, icons, names and keys; they differ only in size and placement. Every
// control reads the one provider (usePlayer). Transport and the scrubber take an optional `track`:
// on a track's page they act on that track (switching the player to it on first use) without
// taking over a different track that is playing; the dock passes none and drives the current one.
// Speed, volume and sleep are the player's own settings and need no track.
import { useEffect, useId, useRef } from "react";
import { clamp } from "../hooks/hooks.js";
import { Icon, iconCaptions, iconFastForward, iconList, iconMute, iconPause, iconPlay, iconRewind, iconSkipNext, iconTimer, iconVolume, } from "../icons/icons.react.js";
import { Menu } from "../menu/menu.react.js";
import { rangeFill } from "../range-slider/range-slider.js";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.js";
import { plainLink } from "../shell/shell.react.js";
import { RATE_MAX, RATE_MIN, RATE_STEP, SLEEP_MINUTES, SPEEDS, activeChapterIndex, formatRate, formatTime, sleepLabel, spokenTime, } from "./player.js";
import { usePlayer } from "./player-context.react.js";
// ---------------------------------------------------------------------------------------
// Icons, from the shared set. Each is aria-hidden; the control carries the name. player.css sizes
// them (.cap-player-icon) and draws them at the player's stroke.
const PlayIcon = () => _jsx(Icon, { d: iconPlay, fill: true, className: "cap-player-icon" });
const PauseIcon = () => _jsx(Icon, { d: iconPause, fill: true, className: "cap-player-icon" });
const VolumeIcon = () => _jsx(Icon, { d: iconVolume, className: "cap-player-icon" });
const MutedIcon = () => _jsx(Icon, { d: iconMute, className: "cap-player-icon" });
// Sets --cap-range-fill on a range input through the CSSOM (the field's range fills to its thumb).
function useRangeFill(ref, value, min, max) {
    useEffect(() => {
        ref.current?.style.setProperty("--cap-range-fill", rangeFill(value, min, max));
    }, [ref, value, min, max]);
}
// Whether a control aimed at `track` acts on what is loaded.
function useTarget(track) {
    const p = usePlayer();
    const isThis = !track || p.current?.id === track.id;
    return { p, isThis };
}
// ---------------------------------------------------------------------------------------
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
    const input = useRef(null);
    const dur = (isThis ? p.duration : 0) || track?.duration || p.current?.duration || 0;
    const pos = isThis ? p.currentTime : 0;
    const chapters = (isThis ? (track ?? p.current)?.chapters : track?.chapters) ?? [];
    useRangeFill(input, Math.min(pos, dur || 1), 0, dur || 1);
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
    return (_jsxs("div", { className: "cap-player-scrubber", children: [_jsx("span", { className: "cap-player-time", children: formatTime(pos) }), _jsxs("span", { className: "cap-player-track", children: [_jsx("input", { ref: input, className: "cap-range cap-player-seek", type: "range", min: 0, max: dur || 1, step: 1, value: Math.min(pos, dur || 1), disabled: !dur, "aria-label": "Seek", "aria-valuetext": `${spokenTime(pos)} of ${spokenTime(dur)}`, onChange: (e) => seekTo(Number(e.target.value)), onKeyDown: onKey }), ticks && dur > 0 && chapters.length ? (_jsx("svg", { className: "cap-player-ticks", viewBox: "0 0 100 10", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false", children: chapters.map((c) => {
                            const x = Math.min(100, (c.start / dur) * 100);
                            return _jsx("line", { x1: x, x2: x, y1: "0", y2: "10" }, `${c.start}-${c.title}`);
                        }) })) : null] }), _jsx("span", { className: "cap-player-time", children: formatTime(dur) })] }));
}
// ---------------------------------------------------------------------------------------
// Settings: inline in the phone's sheet, and behind a popover or a menu in the dock and on the surface.
// The speed presets as radios (one tab stop, the arrow keys choose) and a fine range from 0.5 to 3.
export function SpeedOptions() {
    const p = usePlayer();
    const name = useId();
    const fine = useRef(null);
    useRangeFill(fine, p.rate, RATE_MIN, RATE_MAX);
    return (_jsxs("div", { className: "cap-player-options", children: [_jsxs("fieldset", { className: "cap-player-choices", "data-layout": "grid", children: [_jsx("legend", { className: "cap-player-legend", children: "Speed" }), SPEEDS.map((s) => {
                        const on = Math.abs(s - p.rate) < 0.001;
                        return (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "radio", name: name, value: s, checked: on, 
                                    // Focus lands on the chosen speed when the popover opens.
                                    ref: (el) => {
                                        el?.toggleAttribute("autofocus", on);
                                    }, onChange: () => p.setRate(s) }), formatRate(s)] }, s));
                    })] }), _jsxs("label", { className: "cap-player-fine", children: [_jsx("span", { className: "cap-sr-only", children: "Fine playback speed" }), _jsx("input", { ref: fine, className: "cap-range", type: "range", min: RATE_MIN, max: RATE_MAX, step: RATE_STEP, value: p.rate, "aria-valuetext": `${p.rate.toFixed(2)} times speed`, onChange: (e) => p.setRate(Number(e.target.value)) })] })] }));
}
const off = (a, b) => Math.abs(a - b) > 0.001;
export function SpeedControl({ side = "bottom" }) {
    const p = usePlayer();
    return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "cap-player-btn", "data-part": "setting", "data-active": off(p.rate, 1) ? "" : undefined, "aria-label": `Playback speed, currently ${formatRate(p.rate)}`, children: _jsx("span", { className: "cap-player-rate", children: formatRate(p.rate) }) }), _jsx(PopoverContent, { side: side, align: "end", size: "sm", "aria-label": "Playback speed", children: _jsx(SpeedOptions, {}) })] }));
}
// Mute and a volume range. Not on a touch screen (`data-part="volume"` is hidden under a coarse
// pointer): phones set volume with their own buttons, and iOS ignores a page's volume (MDN,
// HTMLMediaElement.volume).
export function VolumeControl({ side = "bottom" }) {
    const p = usePlayer();
    const range = useRef(null);
    const silent = p.muted || p.volume === 0;
    const shown = p.muted ? 0 : p.volume;
    useRangeFill(range, shown, 0, 1);
    return (_jsx("span", { className: "cap-player-volume", children: _jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "cap-player-btn", "data-part": "setting", "data-active": silent ? "" : undefined, "aria-label": silent ? "Volume, muted" : `Volume, ${Math.round(p.volume * 100)} percent`, children: silent ? _jsx(MutedIcon, {}) : _jsx(VolumeIcon, {}) }), _jsx(PopoverContent, { side: side, align: "end", size: "auto", "aria-label": "Volume", children: _jsxs("div", { className: "cap-player-volume-row", children: [_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "setting", "aria-label": p.muted ? "Unmute" : "Mute", onClick: p.toggleMute, children: silent ? _jsx(MutedIcon, {}) : _jsx(VolumeIcon, {}) }), _jsxs("label", { className: "cap-player-fine", children: [_jsx("span", { className: "cap-sr-only", children: "Volume" }), _jsx("input", { ref: (el) => {
                                            range.current = el;
                                            el?.setAttribute("autofocus", "");
                                        }, className: "cap-range", type: "range", min: 0, max: 1, step: 0.05, value: shown, "aria-valuetext": `${Math.round(shown * 100)} percent`, onChange: (e) => p.setVolume(Number(e.target.value)) })] })] }) })] }) }));
}
const sleepValue = (s) => (s == null ? "off" : String(s));
const sleepFrom = (v) => v === "off" ? null : v === "end" ? "end" : Number(v);
const sleepItems = (noun) => [
    { value: "off", label: "Off" },
    { value: "end", label: `End of ${noun}` },
    ...SLEEP_MINUTES.map((m) => ({ value: String(m), label: `${m} minutes` })),
];
// The sleep timer as radios, for the phone's sheet.
export function SleepOptions() {
    const p = usePlayer();
    const name = useId();
    return (_jsxs("fieldset", { className: "cap-player-choices", children: [_jsx("legend", { className: "cap-player-legend", children: "Sleep timer" }), sleepItems(p.noun).map((o) => (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "radio", name: name, value: o.value, checked: sleepValue(p.sleep) === o.value, onChange: () => p.setSleep(sleepFrom(o.value)) }), o.label] }, o.value)))] }));
}
// The sleep timer as a menu of radio items (the shared menu).
export function SleepControl({ container }) {
    const p = usePlayer();
    return (_jsx("span", { className: "cap-player-menu", "data-active": p.sleep != null ? "" : undefined, children: _jsx(Menu, { label: _jsx(Icon, { d: iconTimer, className: "cap-player-icon" }), "aria-label": `Sleep timer, ${sleepLabel(p.sleep, p.noun)}`, chevron: false, container: container, items: [
                {
                    type: "radio-group",
                    label: "Sleep timer",
                    value: sleepValue(p.sleep),
                    onValueChange: (v) => p.setSleep(sleepFrom(v)),
                    items: sleepItems(p.noun),
                },
            ] }) }));
}
// The chapters as a menu of radio items: the one playing is checked, choosing one seeks to it.
export function ChaptersControl({ container }) {
    const p = usePlayer();
    const chapters = p.current?.chapters ?? [];
    if (!chapters.length)
        return null;
    const cur = activeChapterIndex(chapters, p.currentTime);
    return (_jsx("span", { className: "cap-player-menu", children: _jsx(Menu, { label: _jsx(Icon, { d: iconList, className: "cap-player-icon" }), "aria-label": "Chapters", chevron: false, container: container, items: [
                {
                    type: "radio-group",
                    label: "Chapters",
                    closeOnClick: true,
                    value: String(cur),
                    onValueChange: (v) => {
                        const c = chapters[Number(v)];
                        if (c)
                            p.seek(c.start);
                    },
                    items: chapters.map((c, i) => ({
                        value: String(i),
                        label: `${formatTime(c.start)} ${c.title}`,
                    })),
                },
            ] }) }));
}
// The chapters as buttons, for the phone's sheet: the one playing is aria-current.
export function ChapterOptions({ onSelect }) {
    const p = usePlayer();
    const chapters = p.current?.chapters ?? [];
    if (!chapters.length)
        return null;
    const cur = activeChapterIndex(chapters, p.currentTime);
    return (_jsxs("section", { className: "cap-player-options", "aria-label": "Chapters", children: [_jsx("p", { className: "cap-player-legend", "aria-hidden": "true", children: "Chapters" }), _jsx("ul", { className: "cap-player-chapters", children: chapters.map((c, i) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-player-chapter", "aria-current": i === cur ? "true" : undefined, onClick: () => {
                            p.seek(c.start);
                            onSelect?.();
                        }, children: [_jsx("span", { className: "cap-player-at", children: formatTime(c.start) }), _jsx("span", { className: "cap-player-chapter-title", children: c.title })] }) }, `${c.start}-${c.title}`))) })] }));
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
