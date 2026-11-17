// The dictionary entry's speaker. The server renders a plain link to the clip, which any browser
// plays with script off; this swaps in the button, which plays the clip in place on click, Enter or
// Space (a native button gives all three). Nothing plays until asked and the clip is fetched on the
// first press, not before. aria-pressed carries the state while it plays; a second press stops it.
// A clip that cannot load or play brings the link back, so the reader still has a way to hear it.
/** The speaker's name: what it does and for which word. */
export function listenLabel(term) {
    return `Listen to the pronunciation of ${term}`;
}
/**
 * Wires one speaker pair: `button` (hidden in the markup, `data-src` the clip) and `link` (the
 * no-script link). Shows the button, hides the link, and returns a function that detaches.
 */
export function wireListen(button, link) {
    const src = button.dataset.src || link.getAttribute("href") || "";
    let audio = null;
    let playing = false;
    const paint = (on) => {
        playing = on;
        button.setAttribute("aria-pressed", String(on));
    };
    const fallBack = () => {
        paint(false);
        const hadFocus = document.activeElement === button;
        button.hidden = true;
        link.hidden = false;
        if (hadFocus)
            link.focus();
    };
    const clip = () => {
        if (audio)
            return audio;
        const created = new Audio();
        created.preload = "none";
        created.src = src;
        created.addEventListener("play", () => paint(true));
        created.addEventListener("pause", () => paint(false));
        created.addEventListener("ended", () => paint(false));
        created.addEventListener("error", fallBack);
        audio = created;
        return created;
    };
    const onClick = () => {
        const player = clip();
        if (playing) {
            player.pause();
            player.currentTime = 0;
            paint(false);
            return;
        }
        player.currentTime = 0;
        paint(true);
        player.play().catch((error) => {
            // A second press while the first play was still starting: the reader stopped it, nothing failed.
            if (error instanceof DOMException && error.name === "AbortError")
                return paint(false);
            fallBack();
        });
    };
    button.addEventListener("click", onClick);
    link.hidden = true;
    button.hidden = false;
    return () => {
        button.removeEventListener("click", onClick);
        audio?.pause();
        paint(false);
        button.hidden = true;
        link.hidden = false;
    };
}
// Attaches to every [data-cap="dictionary-entry"] under root not yet attached. Returns a function
// that detaches.
// The root is Element | Document | DocumentFragment, not ParentNode: under @cloudflare/workers-types
// an HTMLFormElement does not type as a ParentNode, so a site could not pass its form.
export function enhance(root = document) {
    const undo = [];
    for (const entry of root.querySelectorAll("[data-cap='dictionary-entry']:not([data-cap-ready])")) {
        const button = entry.querySelector("button[data-cap-part='listen']");
        const link = entry.querySelector("a[data-cap-part='listen-link']");
        if (!button || !link)
            continue;
        entry.dataset.capReady = "";
        const off = wireListen(button, link);
        undo.push(() => {
            off();
            delete entry.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
