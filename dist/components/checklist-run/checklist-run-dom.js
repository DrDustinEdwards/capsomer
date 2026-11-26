// The checklist run's small helpers: element builders, the download of a record, the timer's beep and the screen wake
// lock (checklist-run.ts owns the run and says when).
export const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props))
        node.setAttribute(k, v);
    node.append(...kids);
    return node;
};
export const button = (label, variant, part, onClick) => {
    const b = el("button", { type: "button", class: "cap-btn", "data-variant": variant, "data-run": part }, label);
    b.addEventListener("click", onClick);
    return b;
};
export function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = el("a", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
/** The timer's beep: the audio context is made on a press (browsers want a gesture) and used when a timer rings. */
export function beeper() {
    let audio = null;
    return {
        ensure() {
            try {
                audio ??= new AudioContext();
                if (audio.state === "suspended")
                    void audio.resume();
            }
            catch {
                audio = null;
            }
        },
        beep() {
            if (!audio)
                return;
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            gain.gain.value = 0.15;
            osc.frequency.value = 880;
            osc.connect(gain).connect(audio.destination);
            osc.start();
            osc.stop(audio.currentTime + 0.35);
        },
    };
}
/** Keeps the screen on during a run. `onDenied` says so when the browser would not. */
export function screenLock(onDenied) {
    let lock = null;
    return {
        async hold() {
            try {
                lock = (await navigator.wakeLock?.request("screen")) ?? null;
            }
            catch {
                // Not every browser lets a page hold the screen. Said, not hidden.
                lock = null;
                onDenied();
            }
        },
        async release() {
            try {
                await lock?.release();
            }
            catch { }
            lock = null;
        },
    };
}
