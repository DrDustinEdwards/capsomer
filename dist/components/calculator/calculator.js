// The calculator: a labeled form drawn from a field list, and a result region drawn from a plain
// view tree, so a server component and this module build the same markup from one description and
// neither parses HTML. The site owns the arithmetic: it passes a `run` function that turns the
// field values into a CalculatorResult. Extracted from dustinedwards.info (app/components/phage-tool.tsx,
// app/lib/phage-tools.mjs resultView and textParts, app/enhance/tools.ts).
/** The tags a view node may use. Anything else is refused, so a tree can never carry a script. */
export const VIEW_TAGS = [
    "div",
    "p",
    "span",
    "h3",
    "h4",
    "ol",
    "ul",
    "li",
    "strong",
    "em",
    "sup",
    "sub",
    "code",
];
/** A line with each `10^n` split out as a power: "1 x 10^-3" is "1 x 10" and a superscript "−3". */
export function textParts(line) {
    const parts = [];
    let last = 0;
    for (const match of line.matchAll(/10\^(-?\d+)/g)) {
        const at = match.index ?? 0;
        parts.push({ text: `${line.slice(last, at)}10` });
        parts.push({ text: (match[1] ?? "").replace("-", "−"), sup: true });
        last = at + match[0].length;
    }
    parts.push({ text: line.slice(last) });
    return parts.filter((part) => part.text !== "");
}
/** A line as view nodes, its powers as `sup`. */
export function lineNodes(line) {
    return textParts(line).map((part) => part.sup ? { tag: "sup", children: [part.text] } : part.text);
}
/**
 * What a result looks like, as plain nodes. `summary` is the one line per section the status region
 * announces; `detail` is the worked steps under it. An error is the summary alone.
 */
export function resultView(result) {
    if (!result.ok) {
        return {
            summary: [{ tag: "p", className: "cap-calculator-error", children: [result.error] }],
            detail: [],
        };
    }
    const summary = result.sections
        .filter((section) => section.result)
        .map((section) => ({
        tag: "p",
        className: "cap-calculator-answer",
        children: [
            `${section.heading}: `,
            { tag: "strong", children: lineNodes(section.result ?? "") },
        ],
    }));
    const detail = result.sections.map((section) => ({
        tag: "div",
        className: "cap-calculator-section",
        children: [
            { tag: "h3", children: [section.heading] },
            {
                tag: "ol",
                className: "cap-calculator-steps",
                children: section.steps.map((step) => ({ tag: "li", children: lineNodes(step) })),
            },
            ...(section.notes ?? []).map((note) => ({
                tag: "p",
                className: "cap-calculator-note",
                children: lineNodes(note),
            })),
        ],
    }));
    return { summary, detail };
}
/** Throws on a tag outside VIEW_TAGS: a bug in the site's tree, never something to draw. */
export function checkTag(tag) {
    if (!VIEW_TAGS.includes(tag))
        throw new Error(`calculator: a view node may not be <${tag}>.`);
    return tag;
}
/** A view node as DOM: elements and text nodes, no markup string. */
export function buildNode(node, doc = document) {
    if (typeof node === "string")
        return doc.createTextNode(node);
    const el = doc.createElement(checkTag(node.tag));
    if (node.className)
        el.className = node.className;
    for (const child of node.children)
        el.appendChild(buildNode(child, doc));
    return el;
}
/** The form's values for the given fields, as strings, cut at 40 characters as the address is. */
export function formValues(form, fields) {
    const data = new FormData(form);
    const values = {};
    for (const name of fields)
        values[name] = String(data.get(name) ?? "").slice(0, 40);
    return values;
}
/**
 * The values for `fields`: the address's where it has them, each field's opening value where not.
 * Cut at 40 characters, so a long query string cannot make a long page.
 */
export function initialValues(fields, params) {
    const values = {};
    for (const field of fields) {
        const given = params?.get(field.name);
        values[field.name] = given == null ? field.value : given.slice(0, 40);
    }
    return values;
}
/**
 * Wires one calculator: recomputes on every input with `run`, writes the result into its status
 * and detail regions, and (unless it is `data-embedded`) writes the values to the address, so a
 * copied URL shows the same calculation. Enter or Calculate recomputes in place.
 */
export function attach(root, run) {
    const form = root.querySelector("form.cap-calculator-form");
    const status = root.querySelector(".cap-calculator-status");
    const detail = root.querySelector(".cap-calculator-detail");
    if (!form || !status || !detail)
        throw new Error("calculator: a calculator needs its form, status region and detail region.");
    const names = [...form.querySelectorAll("input[name]")].map((i) => i.name);
    const embedded = root.hasAttribute("data-embedded");
    const update = () => {
        const values = formValues(form, names);
        const view = resultView(run(values));
        status.replaceChildren(...view.summary.map((n) => buildNode(n)));
        detail.replaceChildren(...view.detail.map((n) => buildNode(n)));
        if (embedded)
            return;
        const url = new URL(window.location.href);
        for (const [name, value] of Object.entries(values))
            url.searchParams.set(name, value);
        window.history.replaceState(window.history.state, "", url);
    };
    const onSubmit = (event) => {
        event.preventDefault();
        update();
    };
    form.addEventListener("input", update);
    form.addEventListener("submit", onSubmit);
    return () => {
        form.removeEventListener("input", update);
        form.removeEventListener("submit", onSubmit);
    };
}
/**
 * Attaches to every [data-cap="calculator"] under root not yet attached, each with the `run` its
 * `data-calculator` names in `runs`. A calculator with no run is an error, not a silent dead form.
 * The root is Element | Document | DocumentFragment, not ParentNode: under
 * @cloudflare/workers-types an HTMLFormElement does not type as a ParentNode.
 */
export function enhance(root = document, runs = {}) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='calculator']:not([data-cap-ready])")) {
        const id = el.dataset.calculator ?? "";
        const run = runs[id];
        if (!run)
            throw new Error(`calculator: no run function for "${id}".`);
        el.dataset.capReady = "";
        const off = attach(el, run);
        undo.push(() => {
            off();
            delete el.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
