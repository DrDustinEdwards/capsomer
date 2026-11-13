import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { barChart } from "enarratio/lite/bar";
import { Alert } from "../banner/banner.react.js";
import { Button } from "../button/button.react.js";
import { ChartFrame } from "../chart-frame/chart-frame.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { Disclosure } from "../disclosure/disclosure.react.js";
import { Check, Field } from "../field/field.react.js";
import { Meter } from "../meter/meter.react.js";
import { Panel } from "../panel/panel.react.js";
import { Status } from "../status/status.react.js";
import { dayKey } from "@dustinedwards/site-runtime/time";
import { dayTotals, pace, paceLine, recentDays, streak, targetFor, WEEKDAYS, weekdayName, weekSentence, } from "./writing-progress.js";
import { useBrowserZone, useCleanId } from "../hooks/hooks.react.js";
const n = (value) => value.toLocaleString("en-US");
// The last days as Enarratio's bar chart, oldest first, with the band at or above today's target;
// the table behind its "Show data" holds the same numbers.
function weekChart(days, target, source, id) {
    const data = days.map((d) => ({ day: weekdayName(d.day).slice(0, 3), words: d.words })).reverse();
    const off = [...new Set(days.filter((d) => !d.writingDay).map((d) => weekdayName(d.day)))];
    const top = Math.max(0, ...days.map((d) => d.words));
    return (width, fit) => barChart({
        data,
        x: "day",
        y: "words",
        width,
        height: 220,
        id,
        title: `Words typed, the last ${days.length} days`,
        subtitle: `${weekdayName(days.at(-1).day)} to today`,
        alt: weekSentence(days, target),
        xLabel: "Day",
        yLabel: "Typed",
        yUnit: "words",
        formatValue: n,
        notes: off.length ? `Days off: ${off.join(", ")}.` : undefined,
        source,
        annotations: target === null
            ? undefined
            : [
                {
                    type: "range",
                    axis: "y",
                    from: target,
                    to: Math.max(target, top),
                    label: "Target",
                },
            ],
        ...fit,
    });
}
// Today's writing: words typed today against today's target, the streak, the pace a deadline asks
// for, the last days as a chart, and the writer's own goal.
export function WritingProgress({ entries, goal, projectTarget, deadline, wordsNow, zone: serverZone, canEdit, action, Form = PlainForm, error = null, saved = false, goalNote, note = "Pastes, imports and AI drafts you take as your draft do not count. A day runs midnight to midnight on this device.", source = "Typed words in the authorship record", title = "Today's writing", days: dayCount = 7, now: fixedNow, }) {
    const zone = useBrowserZone(serverZone);
    const chartId = `progress-${useCleanId()}`;
    const [mode, setMode] = useState(goal.mode);
    // A new goal from the server replaces the mode being chosen, adjusted while rendering.
    const [goalMode, setGoalMode] = useState(goal.mode);
    if (goal.mode !== goalMode) {
        setGoalMode(goal.mode);
        setMode(goal.mode);
    }
    const [now] = useState(() => fixedNow ?? new Date());
    const today = dayKey(now, zone);
    const totals = dayTotals(entries, zone, goal.allowNegative);
    const wordsToday = totals.get(today) ?? 0;
    const paced = pace({
        projectTarget,
        deadline,
        wordsNow,
        wordsToday,
        today,
        writingDays: goal.writingDays,
    });
    const target = targetFor(goal, today, paced);
    const dayOff = !goal.writingDays.includes(new Date(`${today}T12:00:00Z`).getUTCDay());
    const run = streak(totals, today, target, goal.writingDays);
    const met = target !== null && wordsToday >= target;
    const recent = recentDays(totals, today, dayCount, goal.writingDays);
    return (_jsx(Panel, { title: title, src: "Typed words only", className: "cap-progress", children: _jsxs("div", { className: "cap-progress-body", "data-cap": "writing-progress", children: [target !== null ? (_jsx(Meter, { label: "Typed today", value: Math.max(0, wordsToday), max: target, display: `${n(wordsToday)} of ${n(target)}`, valueText: `${n(wordsToday)} of ${n(target)} words typed today.${met ? " Target met." : ""}`, tone: met ? "ok" : undefined, note: met ? "Today's target is met." : `${n(target - wordsToday)} to go today.` })) : (_jsxs("p", { className: "cap-progress-line", children: [_jsx("strong", { children: n(wordsToday) }), " word", wordsToday === 1 ? "" : "s", " typed today.", " ", _jsx("span", { className: "cap-muted", children: dayOff
                                ? "A day off: no target today."
                                : goal.mode === "deadline"
                                    ? "No pace to work out yet."
                                    : "No daily target set." })] })), met ? _jsx(Status, { tone: "ok", children: "Target met" }) : null, _jsxs("p", { className: "cap-progress-line", children: ["Streak: ", _jsx("strong", { children: run }), " day", run === 1 ? "" : "s", " in a row at the target.", target === null ? _jsx("span", { className: "cap-muted", children: " A streak needs a target." }) : null] }), goal.mode === "deadline" || deadline || projectTarget ? (_jsx("p", { className: "cap-progress-line cap-muted", children: paceLine(paced, deadline) })) : null, _jsx(ChartFrame, { draw: weekChart(recent, target, source, chartId), width: 360 }), note ? _jsx("p", { className: "cap-progress-note", children: note }) : null, error ? (_jsx(Alert, { tone: "crit", children: error })) : saved ? (_jsx("p", { className: "cap-progress-line", role: "status", children: "Your target is saved." })) : null, canEdit ? (_jsx(Disclosure, { summary: "Your target", defaultOpen: Boolean(error), children: _jsxs(Form, { method: "post", action: action, className: "cap-progress-form", children: [_jsx("input", { type: "hidden", name: "intent", value: "goal" }), _jsxs("fieldset", { className: "cap-field", children: [_jsx("legend", { className: "cap-field-label", children: "Set the daily target" }), _jsxs("div", { className: "cap-field-options", children: [_jsx(Check, { type: "radio", name: "mode", value: "daily", label: "By hand", checked: mode === "daily", onChange: () => setMode("daily") }), _jsx(Check, { type: "radio", name: "mode", value: "deadline", label: "From the deadline", checked: mode === "deadline", onChange: () => setMode("deadline") })] })] }), _jsx(Field, { label: "Words a day", help: mode === "deadline"
                                    ? "Used only when you set it by hand."
                                    : "Leave empty for no target.", children: _jsx("input", { className: "cap-input", name: "dailyTarget", inputMode: "numeric", defaultValue: goal.dailyTarget ?? "", autoComplete: "off" }) }), goalNote ? _jsx("p", { className: "cap-progress-note", children: goalNote }) : null, _jsxs("fieldset", { className: "cap-field", children: [_jsx("legend", { className: "cap-field-label", children: "Writing days" }), _jsx("div", { className: "cap-progress-days", children: [1, 2, 3, 4, 5, 6, 0].map((d) => (_jsx(Check, { name: "writingDays", value: String(d), label: WEEKDAYS[d], defaultChecked: goal.writingDays.includes(d) }, d))) })] }), _jsx(Check, { name: "allowNegative", value: "1", label: "Let deletions take a day below zero", defaultChecked: goal.allowNegative }), _jsx("div", { children: _jsx(Button, { type: "submit", children: "Save my target" }) })] }) })) : null] }) }));
}
