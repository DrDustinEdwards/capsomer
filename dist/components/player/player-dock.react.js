import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The docked player and a track's own player surface, both built from the same controls.
// - PlayerDock: fixed to the bottom while something is loaded. It measures its height into
//   --cap-player-dock-h on <html> (player.css pads the body and the scroll by it, so nothing ends
//   under it), hides itself (inert) while the loaded track's own surface is on screen, and on a
//   narrow screen keeps speed, sleep, chapters and the transcript in a bottom sheet (the dialog).
// - PlayerSurface: the player on a track's page: a waveform over the scrubber, the transport, and
//   the settings. It tells the provider when it is on screen, so the dock steps aside.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useIsoLayoutEffect } from "../hooks/hooks.react.js";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { Icon, iconAlert, iconChevronUp, iconClose, iconSpinner } from "../icons/icons.react.js";
import { plainLink } from "../shell/shell.react.js";
import { activeChapterIndex } from "./player.js";
import { usePlayer } from "./player-context.react.js";
import { ChapterOptions, ChaptersControl, NextButton, PlayPauseButton, PlayerStatus, Scrubber, SkipButton, SleepControl, SleepOptions, SpeedControl, SpeedOptions, TranscriptLink, VolumeControl, } from "./player-controls.react.js";
// Below this width the dock's settings move into the sheet (player.css's container query agrees).
export const DOCK_SHEET_BELOW = 768;
export function PlayerDock({ label = "Audio player", idle = "Now playing", renderLink = plainLink, }) {
    const p = usePlayer();
    const [sheet, setSheet] = useState(false);
    const dock = useRef(null);
    const loaded = p.current !== null;
    // The dock's real height on <html>, 0 when nothing is loaded; the sheet closes if the dock grows
    // past the phone layout (the inline settings take over there).
    useEffect(() => {
        const root = document.documentElement;
        const el = dock.current;
        if (!loaded || !el) {
            root.style.removeProperty("--cap-player-dock-h");
            return;
        }
        const apply = () => {
            const r = el.getBoundingClientRect();
            root.style.setProperty("--cap-player-dock-h", `${Math.ceil(r.height)}px`);
            if (r.width >= DOCK_SHEET_BELOW)
                setSheet(false);
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => {
            ro.disconnect();
            root.style.removeProperty("--cap-player-dock-h");
        };
    }, [loaded]);
    // The surface came on screen while the sheet was open: the sheet goes with the dock.
    useEffect(() => {
        // oxlint-disable-next-line react/set-state-in-effect -- the sheet belongs to the dock, which has just been hidden
        if (p.surfaceVisible)
            setSheet(false);
    }, [p.surfaceVisible]);
    if (!p.current)
        return null;
    const track = p.current;
    const chapters = track.chapters ?? [];
    const idx = activeChapterIndex(chapters, p.currentTime);
    const chapter = idx >= 0 ? chapters[idx] : null;
    // Auto-hide: still mounted (playback and the lock screen never break), only faded, inert and
    // hidden from assistive technology. The status sits outside, so it is still said.
    const hidden = p.surfaceVisible;
    return (_jsxs(_Fragment, { children: [_jsx(PlayerStatus, {}), _jsx("div", { ref: dock, className: "cap-player-dock", role: "region", "aria-label": label, "aria-hidden": hidden || undefined, inert: hidden || undefined, "data-hidden": hidden ? "" : undefined, children: _jsxs("div", { className: "cap-player-dock-inner", children: [_jsx(Scrubber, { ticks: true }), _jsxs("div", { className: "cap-player-dock-row", children: [_jsxs("div", { className: "cap-player-now", children: [track.href ? (renderLink({
                                            href: track.href,
                                            className: "cap-player-title",
                                            children: track.title,
                                        })) : (_jsx("span", { className: "cap-player-title", children: track.title })), _jsx("span", { className: "cap-player-meta", "data-tone": p.errored ? "crit" : undefined, children: p.errored ? (_jsxs(_Fragment, { children: [_jsx(Icon, { d: iconAlert, className: "cap-player-icon" }), " Error"] })) : p.buffering ? (_jsxs(_Fragment, { children: [_jsx(Icon, { d: iconSpinner, className: "cap-player-icon cap-player-spin" }), " Buffering"] })) : (_jsx("span", { className: "cap-player-meta-text", children: chapter ? chapter.title : idle })) })] }), _jsxs("div", { className: "cap-player-transport", children: [_jsx(SkipButton, { delta: -p.skipBack }), _jsx(PlayPauseButton, {}), _jsx(SkipButton, { delta: p.skipForward }), _jsx(NextButton, {})] }), _jsxs("div", { className: "cap-player-settings", children: [_jsx(SpeedControl, { side: "top" }), _jsx(VolumeControl, { side: "top" }), _jsx(SleepControl, {}), _jsx(ChaptersControl, {})] }), _jsx("button", { type: "button", className: "cap-player-btn cap-player-more", "data-part": "setting", "data-active": p.sleep != null ? "" : undefined, "aria-haspopup": "dialog", "aria-expanded": sheet, "aria-label": "More player controls", onClick: () => setSheet(true), children: _jsx(Icon, { d: iconChevronUp, className: "cap-player-icon" }) }), _jsx("button", { type: "button", className: "cap-player-btn", "data-part": "close", "aria-label": "Close player", onClick: p.dismiss, children: _jsx(Icon, { d: iconClose, className: "cap-player-icon" }) })] })] }) }), _jsxs(Dialog, { open: sheet, onOpenChange: setSheet, placement: "bottom", className: "cap-player-sheet", closeLabel: "Close player controls", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Player controls" }) }), _jsxs(DialogBody, { children: [_jsx(SpeedOptions, {}), _jsx(SleepOptions, {}), _jsx(ChapterOptions, { onSelect: () => setSheet(false) }), track.transcript ? (_jsx(TranscriptLink, { href: track.transcript, renderLink: renderLink })) : null] })] })] }));
}
// The layout effect runs before paint on the client, so a surface already on screen hides the dock
// with no flash; on the server it is a plain effect (never run).
const LazyWaveform = lazy(() => import("./player-waveform.react.js").then((m) => ({ default: m.Waveform })));
export function PlayerSurface({ track, peaks = null, waveform = true, label, transcriptHref, renderLink = plainLink, children, }) {
    const p = usePlayer();
    const { setSurfaceVisible } = p;
    const active = p.current?.id === track.id;
    const section = useRef(null);
    // Only while this track is the one loaded: another track playing keeps the dock in view.
    useIsoLayoutEffect(() => {
        const el = section.current;
        if (!active || !el) {
            setSurfaceVisible(false);
            return;
        }
        const r = el.getBoundingClientRect();
        setSurfaceVisible(r.top < window.innerHeight && r.bottom > 0);
        const io = new IntersectionObserver((entries) => setSurfaceVisible(entries[0]?.isIntersecting ?? false), {
            threshold: 0,
        });
        io.observe(el);
        return () => {
            io.disconnect();
            setSurfaceVisible(false);
        };
    }, [active, setSurfaceVisible]);
    const dur = (active && p.duration) || track.duration || 0;
    const pos = active ? p.currentTime : 0;
    const chapters = track.chapters ?? [];
    const idx = activeChapterIndex(chapters, pos);
    const chapter = active && idx >= 0 ? chapters[idx] : null;
    const region = chapter && dur > 0 ? [chapter.start / dur, (chapters[idx + 1]?.start ?? dur) / dur] : null;
    const transcript = transcriptHref ?? track.transcript;
    return (_jsxs("section", { ref: section, className: "cap-player-surface", "aria-label": label ?? `Player for ${track.title}`, children: [chapter ? _jsx("p", { className: "cap-player-chapter-now", children: chapter.title }) : null, waveform ? (_jsx(Suspense, { fallback: _jsx("div", { className: "cap-player-wave-box", "aria-hidden": "true" }), children: _jsx(LazyWaveform, { peaks: peaks, position: dur > 0 ? Math.min(1, pos / dur) : 0, duration: dur, region: region, onSeek: (share) => (active ? p.seek(share * dur) : p.playTrackAt(track, share * dur)) }) })) : null, _jsx(Scrubber, { track: track, ticks: true }), _jsxs("div", { className: "cap-player-surface-row", children: [_jsx(PlayPauseButton, { track: track, size: "lg" }), _jsx(SkipButton, { delta: -p.skipBack, track: track }), _jsx(SkipButton, { delta: p.skipForward, track: track }), _jsxs("div", { className: "cap-player-surface-settings", children: [_jsx(SpeedControl, {}), _jsx(VolumeControl, {}), _jsx(SleepControl, {}), transcript ? _jsx(TranscriptLink, { href: transcript, renderLink: renderLink }) : null] })] }), children ? _jsx("div", { className: "cap-player-surface-extra", children: children }) : null] }));
}
