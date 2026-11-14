import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { listenLabel, wireListen } from "./dictionary-entry.js";
/** A speaker with two sound waves; the waves carry the playing state in CSS. */
export function SpeakerIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { d: "M4 9.5h3.5L12 5.5v13l-4.5-4H4z", fill: "currentColor" }), _jsx("path", { className: "cap-dictionary-entry-wave", d: "M15 9.2a4 4 0 0 1 0 5.6", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { className: "cap-dictionary-entry-wave", d: "M17.6 6.6a7.6 7.6 0 0 1 0 10.8", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
}
// The speaker pair: the link on the server and with script off; once mounted, wireListen (the
// behavior module's) swaps in the button and plays the clip, and brings the link back if it cannot
// load or play. The DOM it changes (hidden, aria-pressed) is not React state, so React leaves it.
function Listen({ src, label }) {
    const link = useRef(null);
    const speaker = useRef(null);
    useEffect(() => (speaker.current && link.current ? wireListen(speaker.current, link.current) : undefined), [src]);
    return (_jsxs(_Fragment, { children: [_jsx("a", { ref: link, className: "cap-dictionary-entry-listen", href: src, "data-cap-part": "listen-link", "aria-label": label, children: _jsx(SpeakerIcon, {}) }), _jsx("button", { ref: speaker, type: "button", className: "cap-dictionary-entry-listen", "data-cap-part": "listen", "data-src": src, "aria-label": label, "aria-pressed": "false", hidden: true, children: _jsx(SpeakerIcon, {}) })] }));
}
// The HTML contract in dictionary-entry.md. A React page needs no enhance() call: each speaker
// wires itself with wireListen. Once hydrated the section carries data-cap-ready, set in an effect, so a later
// enhance() call skips it; server HTML that is never hydrated (an islands page) has none, so
// enhance() wires its speaker.
export function DictionaryEntry(props) {
    const { term, syllables, ipa, respelling, partOfSpeech, plural, senses, etymology, audio, listen = listenLabel(term), } = props;
    const root = useRef(null);
    // React owns this one once it runs: a later enhance() call on the page leaves it alone.
    useEffect(() => {
        if (root.current)
            root.current.dataset.capReady = "";
    }, []);
    return (_jsxs("section", { ref: root, className: "cap-dictionary-entry", "aria-label": `Dictionary entry: ${term}`, "data-cap": "dictionary-entry", children: [_jsxs("p", { className: "cap-dictionary-entry-head", children: [_jsx("dfn", { className: "cap-dictionary-entry-word", children: syllables ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-sr-only", children: term.toLowerCase() }), _jsx("span", { "aria-hidden": "true", children: syllables })] })) : (term) }), ipa || respelling || audio ? (_jsxs("span", { className: "cap-dictionary-entry-pron", children: [ipa ? _jsx("span", { className: "cap-dictionary-entry-ipa", children: ipa }) : null, respelling ? _jsx("span", { className: "cap-dictionary-entry-respell", children: respelling }) : null, audio ? _jsx(Listen, { src: audio, label: listen }) : null] })) : null] }), _jsxs("p", { className: "cap-dictionary-entry-pos", children: [_jsx("i", { children: partOfSpeech }), plural?.length ? (_jsxs(_Fragment, { children: ["; plural", " ", plural.map((form, i) => (_jsxs("span", { children: [i > 0 ? " or " : null, _jsx("i", { children: form })] }, form)))] })) : null] }), _jsx("ol", { className: "cap-dictionary-entry-senses", children: senses.map((sense, i) => (_jsxs("li", { children: [sense.label ? (_jsxs(_Fragment, { children: [_jsxs("i", { className: "cap-dictionary-entry-label", children: [sense.label, "."] }), " "] })) : null, sense.text] }, i))) }), etymology?.length ? (_jsxs("p", { className: "cap-dictionary-entry-ety", children: [_jsx("span", { className: "cap-dictionary-entry-ety-label", children: "Etymology" }), " ", etymology.map((part, i) => typeof part === "string" ? (_jsx("span", { children: part }, i)) : (_jsx("i", { lang: part[0], children: part[1] }, i)))] })) : null] }));
}
