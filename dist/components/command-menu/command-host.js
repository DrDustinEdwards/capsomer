// Calls `fn` once the page is idle, `timeout` ms at most; returns a cancel.
export function whenIdle(fn, timeout = 2000) {
    if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(fn, { timeout });
        return () => cancelIdleCallback(id);
    }
    const t = setTimeout(fn, 200);
    return () => clearTimeout(t);
}
// Ctrl K or Cmd K before the menu is there, by a plain listener: the shortcut registry (and the
// dialog it brings) loads with the menu, which binds the keys itself. Returns an unbind.
export function onModK(run) {
    const onKey = (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            run();
        }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
}
export function createCommandHost(commands, opts = {}, root = document) {
    let menu = null;
    let loading = null;
    let detached = false;
    const undo = [];
    const load = () => (loading ??= import("./command-menu.js")
        .then((m) => {
        if (detached)
            throw new Error("The command host was detached.");
        menu = m.createCommandMenu(commands, opts);
        // The menu binds Ctrl K itself from here on (and Ctrl K in it closes it).
        unbindKey();
        return menu;
    })
        // A failed load is not kept, so the next ask tries the chunk again.
        .catch((error) => {
        loading = null;
        throw error;
    }));
    // A warm-up nobody waits on (idle time, a command that runs without the menu): a failure
    // surfaces where the menu is asked for, as `open` rejecting.
    const warm = () => void load().catch(() => { });
    const open = async (query = "", opener = document.activeElement) => {
        (await load()).open(query, opener);
    };
    const unbindKey = onModK(() => void open());
    undo.push(whenIdle(warm));
    for (const btn of root.querySelectorAll("[data-cap-command-open]:not([data-cap-ready])")) {
        btn.dataset.capReady = "";
        const onClick = () => void open("", btn);
        btn.addEventListener("click", onClick);
        undo.push(() => {
            btn.removeEventListener("click", onClick);
            delete btn.dataset.capReady;
        });
    }
    return {
        get menu() {
            return menu;
        },
        load,
        open,
        runWhenReady(id) {
            warm();
            commands.find((c) => c.id === id)?.run();
        },
        detach() {
            detached = true;
            unbindKey();
            undo.forEach((f) => f());
            menu?.detach();
            menu = null;
        },
    };
}
