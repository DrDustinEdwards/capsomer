import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The waveform, from peaks computed once when the audio was added (computePeaks or decodePeaks in
// player.ts), never from the audio on a reader's page. Two forms:
// - Waveform, on a track's player surface: pointer only and aria-hidden, because the scrubber's
//   range is the seek control (WCAG 2.5.7); a click seeks, the pointer shows the time under it, the
//   played part fills, the leading edge is bright and the chapter playing is tinted.
// - WaveformPreview, in an editor: a still picture (role="img") with chapter markers.
// Both are SVG: the bars' heights are attributes, so nothing needs a style attribute.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ratio } from "../meter/meter.js";
import { WAVEFORM_BARS, formatTime, normalizePeaks, syntheticPeaks } from "./player.js";
export function Waveform({ peaks, position, duration, region, onSeek, bars = WAVEFORM_BARS, previewLabel = "Waveform preview", }) {
    const real = useMemo(() => normalizePeaks(peaks, bars), [peaks, bars]);
    const heights = useMemo(() => real ?? syntheticPeaks(bars), [real, bars]);
    const box = useRef(null);
    const tip = useRef(null);
    const [hover, setHover] = useState(null);
    // The time bubble follows the pointer, placed through the CSSOM.
    useLayoutEffect(() => {
        if (hover !== null)
            tip.current?.style.setProperty("--cap-player-at", `${(hover * 100).toFixed(2)}%`);
    }, [hover]);
    const shareAt = (clientX) => {
        const r = box.current?.getBoundingClientRect();
        return r ? ratio(clientX - r.left, r.width) : 0;
    };
    return (_jsxs("div", { className: "cap-player-wave", children: [_jsxs("div", { ref: box, className: "cap-player-wave-box", "aria-hidden": "true", onClick: (e) => onSeek(shareAt(e.clientX)), onPointerMove: (e) => {
                    setHover(shareAt(e.clientX));
                }, onPointerLeave: () => setHover(null), children: [_jsxs("svg", { className: "cap-player-wave-bars", viewBox: `0 0 ${bars} 100`, preserveAspectRatio: "none", focusable: "false", children: [region ? (_jsx("rect", { className: "cap-player-wave-region", x: region[0] * bars, y: "0", width: Math.max(0, (region[1] - region[0]) * bars), height: "100" })) : null, heights.map((h, i) => {
                                const share = (i + 0.5) / bars;
                                const leading = Math.abs(share - position) < 1 / bars;
                                const played = share <= position;
                                const inRegion = !!region && share >= region[0] && share < region[1];
                                const state = leading
                                    ? "leading"
                                    : played
                                        ? inRegion
                                            ? "region"
                                            : "played"
                                        : undefined;
                                const height = Math.round(h * 100);
                                return (_jsx("rect", { className: "cap-player-wave-bar", "data-state": state, x: i + 0.15, y: (100 - height) / 2, width: "0.7", height: height }, i));
                            })] }), hover !== null ? (_jsx("span", { ref: tip, className: "cap-player-wave-tip", children: formatTime(hover * duration) })) : null] }), real ? null : _jsx("p", { className: "cap-player-wave-note", children: previewLabel })] }));
}
// A still waveform for an editor: what the stored peaks look like, with the chapters marked.
export function WaveformPreview({ peaks, markers = [], label = "Waveform", empty = "No waveform yet", bars, }) {
    const count = bars ?? Math.max(1, peaks.length);
    const heights = useMemo(() => normalizePeaks(peaks, count), [peaks, count]);
    if (!heights)
        return _jsx("div", { className: "cap-player-wave-empty", children: empty });
    return (_jsxs("svg", { className: "cap-player-wave-preview", role: "img", "aria-label": label, viewBox: `0 0 ${count} 100`, preserveAspectRatio: "none", focusable: "false", children: [heights.map((h, i) => {
                const height = Math.max(3, Math.round(h * 100));
                return (_jsx("rect", { className: "cap-player-wave-bar", x: i + 0.1, y: 100 - height, width: "0.8", height: height }, i));
            }), markers.map((m) => (_jsx("line", { className: "cap-player-wave-marker", x1: m * count, x2: m * count, y1: "0", y2: "100" }, m)))] }));
}
