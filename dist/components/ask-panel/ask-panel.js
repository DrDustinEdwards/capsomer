// The AI answer panel's behavior: start a stream, show the answer as it arrives, then the sources, a follow-up and a
// note when the model was cut off, and announce the start and the whole answer once each. Every write is textContent
// or a DOM node: generated text is never markup, so the panel needs no Trusted Types policy at all.
// Extracted from dei's Ask (enhance/ask.ts) in 0.132.0. What the site's stream means (which event carries the sources,
// how its follow-up is marked) stays the site's, through `read` and `split`.
import { answerDelta } from "@dustinedwards/site-runtime/ai-ask";
import { jsonData, readSse } from "../sse/sse.js";
export const ASK_WORDS = {
    label: "AI answer",
    badge: "AI generated",
    note: "May be wrong. Check the sources.",
    // Not "Thinking...": the request is a lookup, and an ellipsis reads as stalling.
    working: "Looking it up.",
    unavailable: "Ask is unavailable.",
    stopped: "Ask stopped early.",
    empty: "No answer for that one.",
    cut: "This answer was cut off before it finished. The sources below say more.",
    sources: "Sources",
    announce: (answer) => `AI answer: ${answer}`,
};
const defaultRead = (e) => ({ delta: answerDelta(jsonData(e)) });
const sameOrigin = (url) => url.startsWith("/") && !url.startsWith("//");
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
// Builds the panel in `container` and starts the stream.
export function ask(container, options) {
    const w = { ...ASK_WORDS, ...options.words };
    const read = options.read ?? defaultRead;
    const split = options.split ?? ((answer) => ({ answer }));
    const allow = options.allowSource ?? sameOrigin;
    const controller = new AbortController();
    container.replaceChildren();
    container.hidden = false;
    const panel = el("div", "cap-ask");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", w.label);
    // Focusable but not a Tab stop, so focus has somewhere to go when a trigger hides itself.
    panel.tabIndex = -1;
    const header = el("div", "cap-ask-header");
    header.append(el("span", "cap-ask-badge", w.badge), el("span", "cap-ask-note", w.note));
    const status = el("p", "cap-ask-status", w.working);
    // Not live: rewritten on every token it would be read over and over. The announcer speaks twice instead.
    const body = el("p", "cap-ask-body");
    body.setAttribute("aria-busy", "true");
    const cutNote = el("p", "cap-ask-cut", w.cut);
    cutNote.hidden = true;
    const sources = el("ul", "cap-ask-sources");
    sources.hidden = true;
    const followUp = el("p", "cap-ask-followup");
    followUp.hidden = true;
    const announcer = el("p", "cap-sr-only");
    announcer.setAttribute("aria-live", "polite");
    panel.append(header, status, body, cutNote, sources, followUp, announcer);
    container.append(panel);
    // A frame later, so the region is in the tree before its text changes and the change is heard.
    requestAnimationFrame(() => {
        if (!announcer.textContent)
            announcer.textContent = w.working;
    });
    let answer = "";
    let firstToken = true;
    const showSources = (list) => {
        const items = [];
        const seen = new Set();
        for (const s of list) {
            if (!allow(s.url) || seen.has(s.url))
                continue;
            seen.add(s.url);
            const li = el("li");
            const a = el("a");
            a.href = s.url;
            a.append(el("span", "cap-ask-source-index", `${items.length + 1}. `), el("span", undefined, s.title));
            li.append(a);
            if (s.kind)
                li.append(el("span", "cap-ask-source-kind", ` ${s.kind}`));
            items.push(li);
        }
        sources.replaceChildren(...(items.length ? [el("li", "cap-ask-sources-heading", w.sources), ...items] : []));
        sources.hidden = items.length === 0;
    };
    const add = (delta) => {
        if (!delta)
            return;
        if (firstToken) {
            status.hidden = true;
            firstToken = false;
        }
        answer += delta;
        // Split on every event, so a follow-up marker never shows in the prose mid-stream.
        const parts = split(answer);
        body.textContent = parts.answer;
        // Rebuilt only when it changed, so the link is not replaced under a reader.
        if (parts.followUp && options.followUpHref && parts.followUp !== followUp.textContent) {
            const link = el("a", undefined, parts.followUp);
            link.href = options.followUpHref(parts.followUp);
            followUp.replaceChildren(link);
            followUp.hidden = false;
        }
    };
    const fail = (message) => {
        status.textContent = message;
        status.hidden = false;
        body.removeAttribute("aria-busy");
        announcer.textContent = message;
    };
    const done = (async () => {
        let response;
        try {
            response = await options.request(controller.signal);
        }
        catch {
            if (!controller.signal.aborted)
                fail(w.unavailable);
            return;
        }
        if (!response.ok || !response.body) {
            fail(w.unavailable);
            return;
        }
        try {
            await readSse(response.body, (e) => {
                const r = read(e);
                if (r.sources)
                    showSources(r.sources);
                if (r.cut)
                    cutNote.hidden = false;
                if (r.delta)
                    add(r.delta);
            }, controller.signal);
        }
        catch {
            if (!controller.signal.aborted)
                fail(w.stopped);
            return;
        }
        if (controller.signal.aborted)
            return;
        body.removeAttribute("aria-busy");
        if (!answer.trim())
            fail(w.empty);
        else
            announcer.textContent =
                w.announce(split(answer).answer) + (cutNote.hidden ? "" : ` ${w.cut}`);
    })();
    return {
        done,
        cancel() {
            controller.abort();
            container.replaceChildren();
            container.hidden = true;
        },
    };
}
// Wires every `[data-cap="ask"]` mount: its `[data-ask-trigger]` button starts `ask()` into its `[data-ask-container]`
// with the question in the mount's `data-ask-question`, read at the click (a live search rewrites it). Guarded on the
// DOM, so two bundles on one page never stream two answers for one click. `options` gives the request for a question.
export function enhance(root = document, options) {
    const undo = [];
    for (const mount of root.querySelectorAll('[data-cap="ask"]:not([data-cap-ready])')) {
        const trigger = mount.querySelector("[data-ask-trigger]");
        const container = mount.querySelector("[data-ask-container]");
        if (!trigger || !container)
            continue;
        mount.dataset.capReady = "";
        const question = () => (mount.dataset.askQuestion ?? "").trim();
        if (!question())
            continue;
        trigger.hidden = false;
        let handle = null;
        const onClick = () => {
            trigger.hidden = true;
            const q = question();
            handle = ask(container, { ...options, request: (signal) => options.request(q, signal) });
            // Hiding the trigger dropped focus to the body (WCAG 2.4.3): put it on the answer it asked for.
            if (!document.activeElement || document.activeElement === document.body) {
                container.querySelector(".cap-ask")?.focus();
            }
        };
        trigger.addEventListener("click", onClick);
        undo.push(() => {
            trigger.removeEventListener("click", onClick);
            handle?.cancel();
        });
    }
    return () => {
        for (const u of undo)
            u();
    };
}
// The request dei's Ask makes: a form post of the question, asking for an event stream.
export function postQuestion(endpoint, field = "q") {
    return (question, signal) => fetch(endpoint, {
        method: "POST",
        signal,
        headers: { accept: "text/event-stream", "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ [field]: question }),
    });
}
