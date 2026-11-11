import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { enhance, renderCompare, renderPatch, setView, VIEWS, } from "./draft-compare.js";
import { choicesOf, startPicks, } from "./draft-compare-merge.js";
import { Button } from "../button/button.react.js";
import { Segmented } from "../segmented/segmented.react.js";
import { markup } from "../trusted-html/trusted-html.js";
// Renders exactly the markup renderCompare writes, so a server render (renderToString) and the
// browser agree, and the same behavior module wires it.
export function DraftCompare({ before, after, labels, view, onViewChange, context, runs, similarity, id, heads, }) {
    const own = useId().replace(/[^a-zA-Z0-9]/g, "");
    const host = useRef(null);
    const [first] = useState(view ?? "side");
    const controlled = view !== undefined;
    const key = JSON.stringify([
        before,
        after,
        labels,
        runs,
        context,
        similarity,
        id,
        controlled,
        heads,
    ]);
    // The view is not part of the html's identity: the radios hold it, in CSS, so choosing one
    // does not rebuild the page's folds and focus.
    const html = useMemo(() => renderCompare(before, after, {
        id: id ?? `compare-${own}`,
        view: first,
        context,
        labels,
        runs,
        similarity,
        remember: !controlled,
        heads,
    }), 
    // oxlint-disable-next-line react/exhaustive-deps -- key holds every input that changes the html; the view is held by the radios
    [key, own]);
    useEffect(() => {
        const el = host.current;
        return el ? enhance(el) : undefined;
    }, [html]);
    useEffect(() => {
        const section = host.current?.querySelector(".cap-compare");
        if (section && view)
            setView(section, view);
    }, [view, html]);
    useEffect(() => {
        const el = host.current;
        if (!el || !onViewChange)
            return undefined;
        const onChange = (e) => {
            const t = e.target;
            if (t.matches(".cap-compare-bar input[type='radio']") &&
                VIEWS.includes(t.value))
                onViewChange(t.value);
        };
        el.addEventListener("change", onChange);
        return () => el.removeEventListener("change", onChange);
    }, [onViewChange, html]);
    return _jsx("div", { ref: host, dangerouslySetInnerHTML: markup(html) });
}
// The patch mode: a unified patch by line, with a literal plus or minus on each changed line.
// Pure markup, so a server render and the browser agree; there is no behavior to attach.
export function DraftPatch({ patch, title, id }) {
    const own = useId().replace(/[^a-zA-Z0-9]/g, "");
    const html = useMemo(() => renderPatch(patch, { id: id ?? `patch-${own}`, title }), [patch, title, id, own]);
    return _jsx("div", { dangerouslySetInnerHTML: markup(html) });
}
const MERGE_LABELS = {
    mine: "Your text",
    theirs: "The saved copy",
    keepMine: "Keep yours",
    keepTheirs: "Take the saved copy",
    keepBoth: "Keep both",
    notInMine: "Not in your text",
    notInTheirs: "Not in the saved copy",
    changedMine: "changed here",
    changedTheirs: "changed there",
    leftOut: "left out",
    intro: "Choose which text to keep for each difference, then use the merged text and save as usual. The unsaved text stays exactly as it is until then.",
    withBase: "Where only one side changed a passage, that side is already chosen.",
    withoutBase: "The version both started from could not be read, so each starts on yours.",
    apply: "Use the merged text",
};
/** "3 differences, 1 changed on both": for the heading or panel the merge sits in. */
export function mergeCountsText(plan) {
    const choices = choicesOf(plan);
    const both = choices.filter((c) => c.changedBy === null).length;
    const n = `${choices.length} ${choices.length === 1 ? "difference" : "differences"}`;
    return plan.hasBase ? `${n}, ${both} changed on both` : n;
}
function MergeSide({ blocks, empty, words, show, }) {
    if (blocks.length === 0)
        return _jsx("p", { className: "cap-merge-text cap-merge-empty", children: empty });
    if (words) {
        // One block against one: the words only this side has are marked, on each side alike.
        return (_jsx("pre", { className: "cap-merge-text", children: words.map((w, i) => {
                if (w.op === "same")
                    return w.text;
                if (w.op !== show)
                    return null;
                return (_jsxs("mark", { className: "cap-merge-mark", children: [_jsx("span", { className: "cap-sr-only", children: " only here: " }), w.text] }, i));
            }) }));
    }
    return (_jsx("div", { className: "cap-merge-text", children: blocks.map((b, i) => (_jsx("pre", { children: b.text }, i))) }));
}
// The merge mode: give it a plan (mergePlan, on the server or here) and it holds the picks.
// Key it by the plan's identity, so a new plan starts on its own picks.
export function DraftMerge({ plan, onApply, pending = false, labels, level = 3 }) {
    const l = { ...MERGE_LABELS, ...labels };
    const [picks, setPicks] = useState(() => startPicks(plan));
    const H = `h${level}`;
    // Each choice's place among the choices, by its segment's place in the plan.
    const order = plan.segments.map((_, i) => plan.segments.slice(0, i + 1).filter((x) => x.kind === "choice").length - 1);
    return (_jsxs("div", { className: "cap-merge", children: [_jsxs("p", { className: "cap-merge-intro", children: [l.intro, " ", plan.hasBase ? l.withBase : l.withoutBase] }), _jsx("ol", { className: "cap-merge-list", children: plan.segments.map((s, i) => {
                    if (s.kind === "same") {
                        return (_jsxs("li", { className: "cap-merge-same", children: [s.blocks.length, " ", s.blocks.length === 1 ? "passage" : "passages", " the same on both"] }, i));
                    }
                    const at = order[i];
                    const pick = picks[at] ?? s.start;
                    const label = `Difference ${at + 1}`;
                    const options = [
                        { value: "mine", label: l.keepMine },
                        { value: "theirs", label: l.keepTheirs },
                        // Keeping both needs a passage on each side.
                        {
                            value: "both",
                            label: l.keepBoth,
                            disabled: s.mine.length === 0 || s.theirs.length === 0,
                        },
                    ];
                    return (_jsxs("li", { className: "cap-merge-choice", "data-pick": pick, children: [_jsxs("div", { className: "cap-merge-sides", children: [_jsxs("section", { "aria-label": `${label}: ${l.mine}`, "data-kept": pick !== "theirs" ? "" : undefined, children: [_jsxs(H, { className: "cap-merge-side", children: [l.mine, s.changedBy === "mine" ? ` (${l.changedMine})` : "", pick === "theirs" ? `, ${l.leftOut}` : ""] }), _jsx(MergeSide, { blocks: s.mine, empty: l.notInMine, words: s.words, show: "del" })] }), _jsxs("section", { "aria-label": `${label}: ${l.theirs}`, "data-kept": pick !== "mine" ? "" : undefined, children: [_jsxs(H, { className: "cap-merge-side", children: [l.theirs, s.changedBy === "theirs" ? ` (${l.changedTheirs})` : "", pick === "mine" ? `, ${l.leftOut}` : ""] }), _jsx(MergeSide, { blocks: s.theirs, empty: l.notInTheirs, words: s.words, show: "ins" })] })] }), _jsx(Segmented, { legend: `${label}: which to keep`, hideLegend: true, size: "sm", value: pick, onChange: (value) => setPicks((now) => now.map((p, j) => (j === at ? value : p))), options: options })] }, i));
                }) }), _jsx("div", { className: "cap-merge-actions", children: _jsx(Button, { variant: "primary", pending: pending, onClick: () => onApply(picks), children: l.apply }) })] }));
}
