import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Chart builder: a dialog that builds a chart block from pasted or chosen CSV, a type, the columns,
// a title, a finding and a caption. It lists what the app's chart check flags, offers a finding the
// app drafts from the data (it goes in only when taken), shows the chart before anything is in the
// text (drawn here in the chart frame, or rendered by the site in a sandboxed frame), and inserts
// the block through `onInsert`. The block's syntax is the app's `write` (Prelum's by default).
import { useCleanId } from "../hooks/hooks.react.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../button/button.react.js";
import { ChartFrame } from "../chart-frame/chart-frame.react.js";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../dialog/dialog.react.js";
import { Check, Field } from "../field/field.react.js";
import { Segmented } from "../segmented/segmented.react.js";
import { Select } from "../select/select.react.js";
import { csvColumns } from "@drdustinedwards/site-helpers/source";
import { CHART_TYPES, MAX_CSV_BYTES, chartDirective, chartReady, chooseColumns, csvFileProblem, } from "./chart-builder.js";
const NOT_READY = "Add the data, pick the columns and write the finding first.";
const blank = (type) => ({
    type,
    x: "",
    y: [],
    title: "",
    alt: "",
    caption: "",
    csv: "",
});
export function ChartBuilder({ onInsert, types = CHART_TYPES, write = chartDirective, check, draw, preview, maxBytes = MAX_CSV_BYTES, initial, label = "Insert chart", buttonVariant = "quiet", buttonSize = "sm", }) {
    const [open, setOpen] = useState(false);
    const [opener, setOpener] = useState(null);
    const start = () => ({ ...blank(types[0]?.value ?? "bar"), ...initial });
    const [f, setF] = useState(start);
    const [fileError, setFileError] = useState("");
    const [checked, setChecked] = useState(null);
    const [previewed, setPreviewed] = useState(false);
    const id = useCleanId();
    const frame = `cap-chart-preview-${id}`;
    const titleId = `cap-chart-builder-${id}`;
    const set = (patch) => setF((cur) => ({ ...cur, ...patch }));
    const columns = useMemo(() => csvColumns(f.csv), [f.csv]);
    // A new header picks the columns again, keeping a choice that is still a column. Adjusted while
    // rendering, not in an effect (react.dev, "You might not need an effect").
    // `null` at first, so columns given in `initial` are chosen on the first render.
    const [seen, setSeen] = useState(null);
    if (columns !== seen) {
        setSeen(columns);
        setF((cur) => ({ ...cur, ...chooseColumns(columns, cur) }));
    }
    const ready = chartReady(f);
    const block = ready ? write(f) : "";
    // Only the drafted finding needs a chart it can draw before the finding is written.
    const drawable = ready ? write({ ...f, alt: f.alt.trim() || "Draft." }) : "";
    const final = ready && f.alt.trim() ? block : "";
    useEffect(() => {
        if (!block || !check)
            return;
        let live = true;
        const timer = setTimeout(() => {
            void check(block, drawable).then((result) => live && setChecked({ block, ...result }), () => live && setChecked(null));
        }, 300);
        return () => {
            live = false;
            clearTimeout(timer);
        };
    }, [block, drawable, check]);
    const current = block && checked?.block === block ? checked : null;
    const drawFields = final ? f : null;
    const drawChart = useCallback((width, fit) => (drawFields && draw ? draw(drawFields, width, fit) : ""), 
    // oxlint-disable-next-line react/exhaustive-deps -- `final` stands for the fields it is written from
    [final, draw]);
    const close = () => {
        setOpen(false);
        setPreviewed(false);
    };
    async function readFile(file) {
        setFileError("");
        if (!file)
            return;
        const problem = csvFileProblem(file, maxBytes);
        if (problem)
            return setFileError(problem);
        set({ csv: await file.text() });
    }
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: buttonVariant, size: buttonSize, "aria-haspopup": "dialog", onClick: (event) => {
                    setOpener(event.currentTarget);
                    setOpen(true);
                }, children: label }), _jsxs(Dialog, { open: open, onOpenChange: (o) => !o && close(), placement: "center", size: "lg", returnTo: opener, "aria-labelledby": titleId, children: [_jsxs(DialogHeader, { divider: true, children: [_jsx(DialogTitle, { id: titleId, children: "Insert a chart" }), _jsx(DialogDescription, { children: "Paste the data or choose a CSV file, pick the type and the columns, then write its title and finding. Nothing is in the text until you insert it." })] }), _jsx(DialogBody, { children: _jsxs("div", { className: "cap-chart-builder", children: [_jsx(Segmented, { legend: "Chart type", size: "sm", value: f.type, onChange: (type) => set({ type }), options: types.map((t) => ({ value: t.value, label: t.label })) }), _jsx(Field, { label: "Data, as CSV", help: "The first line names the columns. Paste it here, or choose a file below.", required: true, children: _jsx("textarea", { className: "cap-input cap-chart-builder-csv", rows: 6, spellCheck: false, value: f.csv, onChange: (e) => set({ csv: e.target.value }), placeholder: "year,visits\n2024,1204\n2025,1530" }) }), _jsx(Field, { label: "Or choose a CSV file", error: fileError || undefined, children: _jsx("input", { className: "cap-input", type: "file", accept: ".csv,text/csv", onChange: (e) => void readFile(e.target.files?.[0]) }) }), columns.length >= 2 ? (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Along the bottom (x)", required: true, children: _jsx(Select, { size: "sm", value: f.x, onChange: (e) => set({ x: e.target.value }), options: columns.map((c) => ({ value: c.name, label: c.name })) }) }), _jsxs("fieldset", { className: "cap-chart-builder-y", children: [_jsx("legend", { children: "Measured (y), one series each" }), columns
                                                    .filter((c) => c.name !== f.x)
                                                    .map((c) => (_jsx(Check, { label: c.numeric ? c.name : `${c.name} (not all numbers)`, checked: f.y.includes(c.name), onChange: (e) => set({
                                                        y: e.target.checked
                                                            ? [...f.y, c.name]
                                                            : f.y.filter((n) => n !== c.name),
                                                    }) }, c.name)))] })] })) : f.csv.trim() ? (_jsx("p", { className: "cap-chart-builder-note", children: "The data needs a header line and at least two columns." })) : null, _jsx(Field, { label: "Title", help: "What the chart is about, shown above it.", children: _jsx("input", { className: "cap-input", value: f.title, onChange: (e) => set({ title: e.target.value }) }) }), _jsx(Field, { label: "Finding", required: true, help: "What the reader should see in it, in a sentence. It is shown under the title and read out in place of the chart.", children: _jsx("textarea", { className: "cap-input", rows: 2, value: f.alt, onChange: (e) => set({ alt: e.target.value }) }) }), current?.suggestion ? (_jsxs("div", { className: "cap-chart-builder-suggestion", role: "group", "aria-label": "Suggested finding", children: [_jsxs("p", { className: "cap-chart-builder-note", children: ["Drafted from the data: ", _jsx("q", { children: current.suggestion })] }), _jsx(Button, { size: "sm", variant: "quiet", onClick: () => set({ alt: current.suggestion ?? "" }), children: "Use as the finding" })] })) : null, _jsx(Field, { label: "Caption", help: "Optional. Shown under the chart.", children: _jsx("input", { className: "cap-input", value: f.caption, onChange: (e) => set({ caption: e.target.value }) }) }), check ? (_jsx("div", { role: "status", className: "cap-chart-builder-check", children: current?.findings.length ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "cap-chart-builder-note", children: "The chart check flags:" }), _jsx("ul", { className: "cap-chart-builder-findings", children: current.findings.map((x, i) => (_jsx("li", { children: x.message }, i))) })] })) : current ? (_jsx("p", { className: "cap-chart-builder-note", children: "The chart check flags nothing." })) : null })) : null, draw && final ? (_jsx("section", { className: "cap-chart-builder-drawn", "aria-label": "The chart as it will look", children: _jsx(ChartFrame, { draw: drawChart }) })) : null, preview ? (_jsxs(_Fragment, { children: [_jsxs("form", { method: "post", action: preview.action, target: frame, onSubmit: () => setPreviewed(true), children: [_jsx("input", { type: "hidden", name: preview.name ?? "source", value: final ? (preview.source ?? ((b) => b))(final) : "" }), _jsx(Button, { type: "submit", size: "sm", variant: "quiet", disabledReason: final ? undefined : NOT_READY, children: "Preview as the site shows it" })] }), _jsx("iframe", { className: "cap-chart-builder-preview", name: frame, title: "The chart as the site renders it", sandbox: "", hidden: !previewed })] })) : null] }) }), _jsxs(DialogFooter, { align: "between", children: [_jsx(DialogClose, { part: "cancel", children: "Cancel" }), _jsx(Button, { variant: "primary", disabledReason: final ? undefined : NOT_READY, onClick: () => {
                                    onInsert(final);
                                    setF(start());
                                    setFileError("");
                                    close();
                                }, children: "Insert chart" })] })] })] }));
}
export { CHART_TYPES, chartDirective } from "./chart-builder.js";
