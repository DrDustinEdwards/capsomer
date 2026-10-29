// The media inspector's autosave.
export const AUTOSAVE_MS = 800;
export function createAutosave(opts) {
    const delay = opts.delay ?? AUTOSAVE_MS;
    let state = "idle";
    let timer = null;
    let running = null;
    let again = false;
    const set = (s, error) => {
        state = s;
        opts.onState?.(s, error);
    };
    const stop = () => {
        if (timer !== null)
            clearTimeout(timer);
        timer = null;
    };
    const run = () => {
        stop();
        if (running) {
            again = true;
            return running;
        }
        set("saving");
        let pending;
        try {
            pending = opts.save();
        }
        catch (err) {
            pending = Promise.reject(err);
        }
        running = pending
            .then(() => {
            running = null;
            if (again) {
                again = false;
                return run();
            }
            set("saved");
            return undefined;
        }, (err) => {
            running = null;
            again = false;
            set("failed", err instanceof Error && err.message ? err.message : "Nothing says why.");
        })
            .then(() => undefined);
        return running;
    };
    return {
        schedule() {
            if (running)
                again = true;
            else
                set("dirty");
            stop();
            timer = setTimeout(() => void run(), delay);
        },
        flush() {
            if (running) {
                again = again || state === "dirty";
                return running;
            }
            if (state === "dirty")
                return run();
            return Promise.resolve();
        },
        retry() {
            return run();
        },
        state: () => state,
        cancel: stop,
    };
}
