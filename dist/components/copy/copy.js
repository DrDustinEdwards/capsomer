// Copy and share: one button that copies another element's text (or shares a link), and says
// what happened in a status bubble beside it. Built to Chrome's Modern Web Guidance copy-button
// guide: Invoker Commands (command="--copy" commandfor="<id>") with a click fallback, the Async
// Clipboard API, one role="status" bubble outside the button for both outcomes, no disabled
// state while the message shows, and a no-break space so VoiceOver reads a repeated message.
// How long a message stays: a success is short news, a failure leaves time to copy by hand.
export const COPIED_MS = 2500;
export const COPY_FAILED_MS = 8000;
// Writes text to the clipboard. Never throws, synchronously or not: a missing clipboard (an
// insecure page) or a refused write is false. Sites are served over HTTPS, so there is no
// execCommand fallback (the guide keeps that for pages that cannot control their protocol).
export async function copyText(text) {
    try {
        if (!text)
            return false;
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        return false;
    }
}
// Shares a link with the system share sheet where there is one, and copies it where there is
// not. A share the person cancels (AbortError) is not a failure and says nothing.
export async function shareLink(data) {
    try {
        if (typeof navigator.share === "function" &&
            (!navigator.canShare || navigator.canShare(data))) {
            await navigator.share(data);
            return "shared";
        }
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
            return "canceled";
        // Any other refusal falls through to the clipboard.
    }
    return (await copyText(data.url)) ? "copied" : "failed";
}
// The text a target holds: a form control's value, a link's address, or the rendered text
// (innerText keeps line breaks that textContent loses).
export function textOf(target) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
        return target.value;
    if (target instanceof HTMLElement)
        return target.innerText.trim();
    return (target.textContent ?? "").trim();
}
// The message for an outcome. A button may name its own with data-copied and data-failed
// ("Link copied"); share outcomes use data-shared.
export function messageFor(outcome, button) {
    const own = button?.dataset;
    if (outcome === "copied")
        return own?.capCopied ?? "Copied";
    if (outcome === "shared")
        return own?.capShared ?? "";
    if (outcome === "failed")
        return own?.capFailed ?? "Copy failed";
    return "";
}
// VoiceOver skips a message equal to the one before it from the same region. One page-wide
// last message is enough: a no-break space makes a repeat differ, and is not read aloud.
let lastMessage = "";
export function distinct(message) {
    const out = message && message === lastMessage ? `${message} ` : message;
    lastMessage = message;
    return out;
}
const timers = new WeakMap();
// Shows an outcome on a button and its bubble (the next .cap-copy-tip in its .cap-copy), then
// clears both. A repeat press restarts the message rather than stacking timers. The button is
// never disabled, so focus stays and a failed copy can be retried at once.
export function report(button, outcome) {
    const tip = button.closest(".cap-copy")?.querySelector(".cap-copy-tip");
    clearTimeout(timers.get(button));
    delete button.dataset.state;
    if (tip)
        tip.textContent = "";
    const message = messageFor(outcome, button);
    if (!message)
        return;
    void button.offsetWidth; // restarts the CSS animation
    button.dataset.state = outcome === "failed" ? "failed" : "done";
    requestAnimationFrame(() => {
        if (tip)
            tip.textContent = distinct(message);
    });
    timers.set(button, setTimeout(() => {
        delete button.dataset.state;
        if (tip)
            tip.textContent = "";
    }, outcome === "failed" ? COPY_FAILED_MS : COPIED_MS));
}
// Runs one command from a button on its target: --copy copies the target's text, --share
// shares the target link's address (or the page's) and copies it where sharing is missing.
export async function run(button, target, command) {
    if (command === "--share") {
        const url = target instanceof HTMLAnchorElement ? target.href : textOf(target) || location.href;
        const title = button.dataset.capShareTitle ?? document.title;
        report(button, await shareLink({ url, title }));
        return;
    }
    report(button, (await copyText(textOf(target))) ? "copied" : "failed");
}
const COMMANDS = new Set(["--copy", "--share"]);
// Attaches to every copy button under root. Where Invoker Commands exist the browser resolves
// commandfor and sends a command event (it does not bubble, so it is caught in the capture
// phase); elsewhere a click listener resolves commandfor the same way. Only one path is
// registered, so a press never copies twice. Returns a function that detaches.
export function enhance(root = document) {
    const host = root;
    const mark = host instanceof Document ? host.documentElement : host;
    if (mark.dataset.capCopyReady !== undefined)
        return () => { };
    mark.dataset.capCopyReady = "";
    let off;
    if ("CommandEvent" in window) {
        const onCommand = (event) => {
            const e = event;
            if (!COMMANDS.has(e.command) || !(e.source instanceof HTMLElement))
                return;
            if (!(event.target instanceof Element))
                return;
            void run(e.source, event.target, e.command);
        };
        host.addEventListener("command", onCommand, true);
        off = () => host.removeEventListener("command", onCommand, true);
    }
    else {
        const onClick = (event) => {
            const button = event.target?.closest("button[command][commandfor]");
            const command = button?.getAttribute("command") ?? "";
            if (!button || !COMMANDS.has(command))
                return;
            const target = document.getElementById(button.getAttribute("commandfor") ?? "");
            if (target)
                void run(button, target, command);
        };
        host.addEventListener("click", onClick);
        off = () => host.removeEventListener("click", onClick);
    }
    return () => {
        off();
        delete mark.dataset.capCopyReady;
    };
}
