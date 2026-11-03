// The permission matrix's behavior: the view switch (By agent, By permission), and the
// pure helpers that turn a matrix into each view's sentences. No framework; the React
// wrapper uses the same helpers.
// One entry per agent: what it holds, in column order, and the card's sentence.
export function holdings(m) {
    return m.agents.map((a) => {
        const held = m.permissions.filter((p) => a.holds.includes(p));
        return { agent: a.name, held, text: held.length ? `Holds: ${held.join(", ")}` : "Holds no permissions" };
    });
}
// One entry per permission: who holds it, in row order, and the card's sentence.
export function holders(m) {
    return m.permissions.map((p) => {
        const agents = m.agents.filter((a) => a.holds.includes(p)).map((a) => a.name);
        return { permission: p, agents, text: agents.length ? `Held by: ${agents.join(", ")}` : "Nobody holds this" };
    });
}
// Shows one view of one matrix and hides the other with the hidden attribute, so the
// hidden view leaves the accessibility tree too.
export function showView(root, view) {
    for (const el of root.querySelectorAll(".cap-perms-view[data-view]")) {
        if (el.closest("[data-cap='permission-matrix']") !== root)
            continue;
        el.hidden = el.dataset.view !== view;
    }
    root.dataset.current = view;
}
function isView(v) {
    return v === "agent" || v === "permission";
}
// Attaches to every [data-cap="permission-matrix"] under root that is not attached yet.
// Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const matrix of root.querySelectorAll("[data-cap='permission-matrix']:not([data-cap-ready])")) {
        matrix.dataset.capReady = "";
        const checked = matrix.querySelector(".cap-perms-bar input[type='radio']:checked");
        if (checked && isView(checked.value))
            showView(matrix, checked.value);
        const onChange = (e) => {
            const input = e.target;
            if (input.type !== "radio" || !input.closest(".cap-perms-bar") || !isView(input.value))
                return;
            showView(matrix, input.value);
        };
        matrix.addEventListener("change", onChange);
        undo.push(() => {
            matrix.removeEventListener("change", onChange);
            delete matrix.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
