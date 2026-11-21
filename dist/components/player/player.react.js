import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
// The loading attribute on a media element, which React's types do not list yet. Eager is the browser's default, so
// it is left out.
const mediaLoading = (loading) => (loading === "lazy" ? { loading: "lazy" } : {});
// A self-hosted video: the native player, its poster, captions, and nothing downloaded before play.
export function Video({ src, title, poster, width, height, captions, transcript, caption, loading = "lazy", }) {
    return (_jsxs("figure", { className: "cap-player", "data-kind": "video", children: [_jsx("video", { src: src, poster: poster, width: width, height: height, controls: true, preload: "none", ...mediaLoading(loading), playsInline: true, "aria-label": title, children: captions ? (_jsx("track", { kind: "captions", src: captions.src, srcLang: captions.lang ?? "en", label: captions.label ?? "English", default: true })) : null }), transcript ? (_jsx("p", { className: "cap-player-transcript", children: _jsxs("a", { href: transcript, children: ["Transcript: ", title] }) })) : null, caption ? _jsx("figcaption", { children: caption }) : null] }));
}
// An audio file: the native player, nothing downloaded before play, and its transcript one link away.
export function Audio({ src, title, transcript, caption, loading = "lazy", }) {
    return (_jsxs("figure", { className: "cap-player", "data-kind": "audio", children: [_jsx("audio", { src: src, controls: true, preload: "none", ...mediaLoading(loading), "aria-label": title }), _jsx("p", { className: "cap-player-transcript", children: _jsxs("a", { href: transcript, children: ["Transcript: ", title] }) }), caption ? _jsx("figcaption", { children: caption }) : null] }));
}
// An embed that makes no request to the service until the reader asks: a link with a poster and a play
// button, and the player in its place on a click. A click with a modifier stays a link.
export function Embed({ service, href, player, title, action, poster, caption, }) {
    const [playing, setPlaying] = useState(false);
    const frame = useRef(null);
    useEffect(() => {
        // Focus follows the activation, so a keyboard reader lands in the player.
        if (playing)
            frame.current?.focus();
    }, [playing]);
    return (_jsxs("figure", { className: "cap-player", "data-kind": "embed", "data-service": service, children: [playing ? (_jsx("iframe", { ref: frame, src: player, title: title, allow: "autoplay; encrypted-media; fullscreen; picture-in-picture", allowFullScreen: true, referrerPolicy: "strict-origin-when-cross-origin" })) : (_jsxs("a", { className: "cap-player-facade", href: href, "data-embed-src": player, "data-embed-title": title, onClick: (e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                        return;
                    e.preventDefault();
                    setPlaying(true);
                }, children: [poster ? (_jsx("img", { className: "cap-player-poster", src: poster.src, srcSet: poster.srcSet, sizes: poster.sizes, width: poster.width, height: poster.height, alt: "", loading: "lazy", decoding: "async" })) : null, _jsx("span", { className: "cap-player-play", "aria-hidden": "true" }), _jsxs("span", { className: "cap-player-label", children: [action, ": ", title] })] })), caption ? _jsx("figcaption", { children: caption }) : null] }));
}
// The persistent audio player and its parts, each in its own file, all reached from here.
export { PlayerProvider, usePlayer } from "./player-context.react.js";
export { ChapterOptions, ChaptersControl, NextButton, PlayPauseButton, PlayTrackButton, PlayerStatus, Scrubber, SkipButton, SleepControl, SleepOptions, SpeedControl, SpeedOptions, TranscriptLink, VolumeControl, } from "./player-controls.react.js";
export { DOCK_SHEET_BELOW, PlayerDock, PlayerSurface } from "./player-dock.react.js";
export { PlayerTranscript } from "./player-transcript.react.js";
export { Waveform, WaveformPreview } from "./player-waveform.react.js";
export { ChapterList, Hosts, KeyMoments, PlayClip } from "./player-extras.react.js";
