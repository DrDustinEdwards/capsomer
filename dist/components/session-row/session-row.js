// Agent session rows: their order (waiting on you first) and the answer buttons of an ask block.
// The word and tone of each state's pill; Stopped differs from Idle by its glyph and word.
export const STATES = {
    needs: { word: "Needs you", tone: "warn", glyph: "warn" },
    failed: { word: "Failed", tone: "crit", glyph: "crit" },
    working: { word: "Working", tone: "info", glyph: "run" },
    idle: { word: "Idle", tone: "nodata", glyph: "none" },
    stopped: { word: "Stopped", tone: "nodata", glyph: "stop" },
};
const RANK = { needs: 0, failed: 1, working: 2, idle: 3, stopped: 4 };
// Waiting on you first, the longest wait at the top; then failed, working, idle, stopped, newest first.
// `since` is a time in milliseconds. Returns a new array.
export function order(sessions) {
    return [...sessions].sort((a, b) => {
        const r = RANK[a.state] - RANK[b.state];
        if (r !== 0)
            return r;
        return a.state === "needs" ? a.since - b.since : b.since - a.since;
    });
}
// How a collapsed run is spoken: "Read file 12 times" (the eye reads "×12").
export function spokenCount(count) {
    return count === 1 ? "once" : `${count} times`;
}
// A click on a button with data-cap-answer inside a row with data-session dispatches a bubbling "cap-answer"
// event ({ session, answer }); the app performs it and sets the button's aria-busy while in flight.
export function enhance(root = document) {
    const undo = [];
    for (const list of root.querySelectorAll("[data-cap='session-row']:not([data-cap-ready])")) {
        list.dataset.capReady = "";
        const onClick = (e) => {
            const btn = e.target.closest("[data-cap-answer]");
            if (!btn || !list.contains(btn))
                return;
            if (btn.getAttribute("aria-busy") === "true" || btn.getAttribute("aria-disabled") === "true")
                return;
            const row = btn.closest("[data-session]");
            const detail = {
                session: row?.dataset.session ?? "",
                answer: btn.dataset.capAnswer ?? "",
            };
            btn.dispatchEvent(new CustomEvent("cap-answer", { bubbles: true, detail }));
        };
        list.addEventListener("click", onClick);
        undo.push(() => {
            list.removeEventListener("click", onClick);
            delete list.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
