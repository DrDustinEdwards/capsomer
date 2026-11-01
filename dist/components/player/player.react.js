import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
// A self-hosted video: the native player, its poster, captions, and nothing downloaded before play.
export function Video({ src, title, poster, width, height, captions, transcript, caption }) {
    return (_jsxs("figure", { className: "cap-player", "data-kind": "video", children: [_jsx("video", { src: src, poster: poster, width: width, height: height, controls: true, preload: "none", playsInline: true, "aria-label": title, children: captions ? _jsx("track", { kind: "captions", src: captions.src, srcLang: captions.lang ?? "en", label: captions.label ?? "English", default: true }) : null }), transcript ? (_jsx("p", { className: "cap-player-transcript", children: _jsxs("a", { href: transcript, children: ["Transcript: ", title] }) })) : null, caption ? _jsx("figcaption", { children: caption }) : null] }));
}
// An audio file: the native player, nothing downloaded before play, and its transcript one link away.
export function Audio({ src, title, transcript, caption }) {
    return (_jsxs("figure", { className: "cap-player", "data-kind": "audio", children: [_jsx("audio", { src: src, controls: true, preload: "none", "aria-label": title }), _jsx("p", { className: "cap-player-transcript", children: _jsxs("a", { href: transcript, children: ["Transcript: ", title] }) }), caption ? _jsx("figcaption", { children: caption }) : null] }));
}
// An embed that makes no request to the service until the reader asks: a link with a poster and a play
// button, and the player in its place on a click. A click with a modifier stays a link.
export function Embed({ service, href, player, title, action, poster, caption }) {
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
                }, children: [poster ? _jsx("img", { className: "cap-player-poster", src: poster.src, srcSet: poster.srcSet, sizes: poster.sizes, width: poster.width, height: poster.height, alt: "", loading: "lazy", decoding: "async" }) : null, _jsx("span", { className: "cap-player-play", "aria-hidden": "true" }), _jsxs("span", { className: "cap-player-label", children: [action, ": ", title] })] })), caption ? _jsx("figcaption", { children: caption }) : null] }));
}
