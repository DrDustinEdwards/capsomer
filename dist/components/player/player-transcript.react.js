import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The read-along transcript. The cues come parsed (Prelum's WebVTT parser) and are grouped here into
// paragraphs that keep each cue's time. The active cue follows the browser's own TextTrack: the cues
// are mirrored onto a hidden metadata track on the player's <audio> and followed through cuechange
// (the playhead stands in where there is no VTTCue). A press on any cue seeks there and plays. The
// active cue scrolls into view inside the transcript's own box only while that box is on screen
// (never moving the page), and a reader who scrolls away gets "Jump to current". Search filters it;
// "Copy with link" copies the selection with a link to its time.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCopy } from "../copy/copy.react.js";
import { SearchField } from "../field/field.react.js";
import { TRANSCRIPT_TRACK_LABEL, activeChapterIndex, formatTime, playheadCue, toParagraphs, } from "./player.js";
import { usePlayer } from "./player-context.react.js";
function highlight(text, q) {
    if (!q)
        return text;
    const lower = text.toLowerCase();
    let at = lower.indexOf(q);
    if (at === -1)
        return text;
    const out = [];
    let from = 0;
    while (at !== -1) {
        if (at > from)
            out.push(text.slice(from, at));
        out.push(_jsx("mark", { className: "cap-player-mark", children: text.slice(at, at + q.length) }, at));
        from = at + q.length;
        at = lower.indexOf(q, from);
    }
    if (from < text.length)
        out.push(text.slice(from));
    return out;
}
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function PlayerTranscript({ cues, track, fallback, shareUrl, attribution = (title, url) => `From "${title}": ${url}`, search = true, copy = true, }) {
    const p = usePlayer();
    const { audioRef } = p;
    const paragraphs = useMemo(() => toParagraphs(cues), [cues]);
    const chapters = track.chapters ?? [];
    const isThis = p.current?.id === track.id;
    const [nativeStart, setNativeStart] = useState(null);
    const [following, setFollowing] = useState(true);
    const [query, setQuery] = useState("");
    const clipboard = useCopy();
    const [boxVisible, setBoxVisible] = useState(false);
    const box = useRef(null);
    const programmatic = useRef(false);
    const settle = useRef(undefined);
    const hasVttCue = typeof window !== "undefined" && typeof VTTCue !== "undefined";
    // The browser's own TextTrack: the cues on one reused hidden metadata track, followed through
    // cuechange, only while this track is the one loaded.
    useEffect(() => {
        const audio = audioRef.current;
        if (!isThis || !audio || !hasVttCue || !cues.length)
            return;
        let tt = null;
        for (const t of Array.from(audio.textTracks))
            if (t.label === TRANSCRIPT_TRACK_LABEL)
                tt = t;
        const track = tt ?? audio.addTextTrack("metadata", TRANSCRIPT_TRACK_LABEL);
        track.mode = "hidden";
        const clear = () => {
            const list = track.cues;
            if (list)
                for (let i = list.length - 1; i >= 0; i--)
                    track.removeCue(list[i]);
        };
        clear();
        for (const c of cues) {
            try {
                track.addCue(new VTTCue(c.start, c.end > c.start ? c.end : c.start + 0.1, ""));
            }
            catch {
                // A malformed cue is skipped.
            }
        }
        const onChange = () => {
            const list = track.activeCues;
            const last = list && list.length ? list[list.length - 1] : null;
            setNativeStart(last ? last.startTime : null);
        };
        track.addEventListener("cuechange", onChange);
        onChange();
        return () => {
            track.removeEventListener("cuechange", onChange);
            clear();
            track.mode = "disabled";
        };
    }, [isThis, cues, hasVttCue, audioRef]);
    const activeStart = !isThis ? null : hasVttCue ? nativeStart : playheadCue(cues, p.currentTime);
    // Centers a cue inside the box by scrolling the box itself, never the page. Reduced motion snaps.
    const center = useCallback((start) => {
        const container = box.current;
        if (start == null || !container)
            return;
        const target = container.querySelector(`[data-cue="${start}"]`);
        if (!target)
            return;
        const c = container.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        const delta = t.top - c.top - (container.clientHeight - t.height) / 2;
        if (Math.abs(delta) < 2)
            return;
        const snap = reduced();
        programmatic.current = true;
        container.scrollBy({ top: delta, behavior: snap ? "auto" : "smooth" });
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => (programmatic.current = false), snap ? 60 : 700);
    }, []);
    // Follows the active cue only while the box is open and on screen, so pressing play with the
    // transcript closed or out of view never moves anything.
    useEffect(() => {
        if (!following || activeStart == null || query || !boxVisible)
            return;
        center(activeStart);
    }, [activeStart, following, query, boxVisible, center]);
    // A reader's own scroll in the box stops the following; the observer says whether it is on screen.
    useEffect(() => {
        const container = box.current;
        if (!container)
            return;
        const onScroll = () => {
            if (!programmatic.current)
                setFollowing(false);
        };
        container.addEventListener("scroll", onScroll, { passive: true });
        const io = new IntersectionObserver((e) => setBoxVisible(e[0]?.isIntersecting ?? false), {
            threshold: 0,
        });
        io.observe(container);
        return () => {
            container.removeEventListener("scroll", onScroll);
            io.disconnect();
            window.clearTimeout(settle.current);
        };
    }, []);
    const jump = (seconds) => (isThis ? p.seek(seconds) : p.playTrackAt(track, seconds));
    // Copied through the copy part, so a refused clipboard says Copy failed as every copy button does.
    const copyQuote = async () => {
        const sel = window.getSelection();
        let text = sel ? sel.toString().trim() : "";
        if (!text)
            return;
        const words = text.split(/\s+/);
        if (words.length > 200)
            text = `${words.slice(0, 200).join(" ")}…`;
        // The time of the cue the selection starts in, else the playhead.
        let t = Math.floor(isThis ? p.currentTime : 0);
        const node = sel?.anchorNode ?? null;
        let el = node instanceof Element ? node : (node?.parentElement ?? null);
        while (el && !el.hasAttribute("data-cue"))
            el = el.parentElement;
        if (el)
            t = Math.floor(Number(el.getAttribute("data-cue")));
        const url = shareUrl
            ? shareUrl(t)
            : new URL(`${track.href ?? location.pathname}?t=${t}`, location.href).href;
        await clipboard.copy(`${text}\n\n${attribution(track.title, url)}`);
    };
    if (!cues.length)
        return _jsx("p", { className: "cap-player-transcript-raw", children: fallback ?? "" });
    const q = query.trim().toLowerCase();
    const shown = q
        ? paragraphs.filter((para) => para.some((c) => c.text.toLowerCase().includes(q)))
        : paragraphs;
    const matches = q
        ? paragraphs.reduce((n, para) => n + para.filter((c) => c.text.toLowerCase().includes(q)).length, 0)
        : 0;
    // A paragraph's chapter and speaker headings, only where they change.
    let lastChapter = -1;
    let lastSpeaker = null;
    const heads = shown.map((para) => {
        const first = para[0];
        const chap = activeChapterIndex(chapters, first.start);
        const showChapter = !q && chap !== -1 && chap !== lastChapter;
        if (showChapter)
            lastChapter = chap;
        const speaker = first.speaker ?? null;
        const showSpeaker = !!speaker && speaker !== lastSpeaker;
        if (speaker)
            lastSpeaker = speaker;
        return { chap, showChapter, speaker, showSpeaker };
    });
    return (_jsxs("div", { className: "cap-player-transcript", children: [search || copy ? (_jsxs("div", { className: "cap-player-transcript-bar", children: [search ? (_jsx(SearchField, { label: "Search transcript", value: query, onChange: setQuery })) : null, q ? (_jsxs("span", { className: "cap-player-meta", children: [matches, " match", matches === 1 ? "" : "es"] })) : null, copy ? (_jsx("button", { type: "button", className: "cap-btn", "data-size": "sm", onClick: () => void copyQuote(), children: _jsx("span", { "aria-live": "polite", children: clipboard.state === "done"
                                ? "Copied"
                                : clipboard.state === "failed"
                                    ? "Copy failed"
                                    : "Copy with link" }) })) : null] })) : null, _jsxs("div", { ref: box, className: "cap-player-transcript-box", children: [shown.map((para, pi) => {
                        const head = heads[pi];
                        const startSec = para[0].start;
                        return (_jsxs("div", { className: "cap-player-para", children: [head.showChapter ? (_jsx("p", { className: "cap-player-para-chapter", children: chapters[head.chap]?.title })) : null, head.showSpeaker ? _jsx("p", { className: "cap-player-speaker", children: head.speaker }) : null, _jsxs("p", { className: "cap-player-para-text", children: [_jsx("button", { type: "button", className: "cap-player-at", "aria-label": `Play from ${formatTime(startSec)}`, onClick: () => jump(startSec), children: formatTime(startSec) }), " ", para.map((c) => (_jsxs("button", { type: "button", className: "cap-player-cue", "data-cue": c.start, "data-kind": c.nonVerbal ? "sound" : undefined, "aria-current": c.start === activeStart ? "true" : undefined, title: formatTime(c.start), onClick: () => jump(c.start), children: [highlight(c.text, q), " "] }, c.start)))] })] }, startSec));
                    }), q && shown.length === 0 ? _jsx("p", { className: "cap-player-meta", children: "No matches." }) : null] }), isThis && !following && activeStart != null && !q ? (_jsx("button", { type: "button", className: "cap-btn cap-player-jump", "data-size": "sm", onClick: () => {
                    setFollowing(true);
                    center(activeStart);
                }, children: "Jump to current" })) : null] }));
}
