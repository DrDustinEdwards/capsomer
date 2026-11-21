import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { Panel } from "../panel/panel.react.js";
import { Row, RowList } from "../row-list/row-list.react.js";
import { Status } from "../status/status.react.js";
// A new account's first steps: each one Done or To do, with its one way to do it until it is done,
// and how many are done beside the heading. Rows are read, not opened.
export function SetupChecklist({ title = "Getting started", steps, ready, level, }) {
    const headingId = useId();
    const done = steps.filter((s) => s.done).length;
    const all = done === steps.length;
    const mark = (on) => on ? _jsx(Status, { tone: "ok", children: "Done" }) : _jsx(Status, { tone: "nodata", children: "To do" });
    return (_jsx(Panel, { title: title, level: level, headingId: headingId, meta: `${done} of ${steps.length} done`, children: _jsxs(RowList, { labelledBy: headingId, gap: "sm", children: [steps.map((s) => (_jsx(Row, { variant: "outline", status: mark(s.done), title: s.title, detail: s.detail, actions: s.done ? undefined : s.action }, s.id))), ready ? (_jsx(Row, { variant: "outline", status: mark(all), title: ready.title, detail: ready.detail })) : null] }) }));
}
