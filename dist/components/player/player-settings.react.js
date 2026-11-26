import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The player's settings, in the phone's sheet and behind a popover or a menu in the dock and on a
// track's surface: speed, volume, the sleep timer and chapters. They read the one provider (usePlayer).
import { useId } from "react";
import { Icon, iconList, iconMute, iconTimer, iconVolume } from "../icons/icons.react.js";
import { Menu } from "../menu/menu.react.js";
import { Range } from "../field/field.react.js";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.js";
import { RATE_MAX, RATE_MIN, RATE_STEP, SLEEP_MINUTES, SPEEDS, activeChapterIndex, formatRate, formatTime, sleepLabel, } from "./player.js";
import { usePlayer } from "./player-context.react.js";
const VolumeIcon = () => _jsx(Icon, { d: iconVolume, className: "cap-player-icon" });
const MutedIcon = () => _jsx(Icon, { d: iconMute, className: "cap-player-icon" });
// Settings: inline in the phone's sheet, and behind a popover or a menu in the dock and on the surface.
// The speed presets as radios (one tab stop, the arrow keys choose) and a fine range from 0.5 to 3.
export function SpeedOptions() {
    const p = usePlayer();
    const name = useId();
    return (_jsxs("div", { className: "cap-player-options", children: [_jsxs("fieldset", { className: "cap-player-choices", "data-layout": "grid", children: [_jsx("legend", { className: "cap-player-legend", children: "Speed" }), SPEEDS.map((s) => {
                        const on = Math.abs(s - p.rate) < 0.001;
                        return (_jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "radio", name: name, value: s, checked: on, 
                                    // Focus lands on the chosen speed when the popover opens.
                                    ref: (el) => {
                                        el?.toggleAttribute("autofocus", on);
                                    }, onChange: () => p.setRate(s) }), formatRate(s)] }, s));
                    })] }), _jsx("span", { className: "cap-player-fine", children: _jsx(Range, { "aria-label": "Fine playback speed", min: RATE_MIN, max: RATE_MAX, step: RATE_STEP, value: p.rate, "aria-valuetext": `${p.rate.toFixed(2)} times speed`, onChange: (e) => p.setRate(Number(e.target.value)) }) })] }));
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
    const silent = p.muted || p.volume === 0;
    const shown = p.muted ? 0 : p.volume;
    return (_jsx("span", { className: "cap-player-volume", children: _jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "cap-player-btn", "data-part": "setting", "data-active": silent ? "" : undefined, "aria-label": silent ? "Volume, muted" : `Volume, ${Math.round(p.volume * 100)} percent`, children: silent ? _jsx(MutedIcon, {}) : _jsx(VolumeIcon, {}) }), _jsx(PopoverContent, { side: side, align: "end", size: "auto", "aria-label": "Volume", children: _jsxs("div", { className: "cap-player-volume-row", children: [_jsx("button", { type: "button", className: "cap-player-btn", "data-part": "setting", "aria-label": p.muted ? "Unmute" : "Mute", onClick: p.toggleMute, children: silent ? _jsx(MutedIcon, {}) : _jsx(VolumeIcon, {}) }), _jsx("span", { className: "cap-player-fine", children: _jsx(Range, { "aria-label": "Volume", ref: (el) => el?.setAttribute("autofocus", ""), min: 0, max: 1, step: 0.05, value: shown, "aria-valuetext": `${Math.round(shown * 100)} percent`, onChange: (e) => p.setVolume(Number(e.target.value)) }) })] }) })] }) }));
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
// The chapters as a list of buttons, the one playing marked aria-current.
export function ChapterButtons({ chapters, current, onGo, }) {
    return (_jsx("ol", { className: "cap-player-chapters", children: chapters.map((c, i) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-player-chapter", "aria-current": i === current ? "true" : undefined, onClick: () => onGo(c.start), children: [_jsx("span", { className: "cap-player-at", children: formatTime(c.start) }), _jsx("span", { className: "cap-player-chapter-title", children: c.title })] }) }, `${c.start}-${c.title}`))) }));
}
// The chapters as buttons, for the phone's sheet: the one playing is aria-current.
export function ChapterOptions({ onSelect }) {
    const p = usePlayer();
    const chapters = p.current?.chapters ?? [];
    if (!chapters.length)
        return null;
    const cur = activeChapterIndex(chapters, p.currentTime);
    return (_jsxs("section", { className: "cap-player-options", "aria-label": "Chapters", children: [_jsx("p", { className: "cap-player-legend", "aria-hidden": "true", children: "Chapters" }), _jsx(ChapterButtons, { chapters: chapters, current: cur, onGo: (seconds) => {
                    p.seek(seconds);
                    onSelect?.();
                } })] }));
}
