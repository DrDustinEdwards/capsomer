import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { barChart } from "enarratio/lite/bar";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { ChartFrame, type ChartFit } from "../chart-frame/chart-frame.react.tsx";
import { PlainForm, type FormComponent } from "../content/content.react.tsx";
import { Disclosure } from "../disclosure/disclosure.react.tsx";
import { Check, Field } from "../field/field.react.tsx";
import { Meter } from "../meter/meter.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { Status } from "../status/status.react.tsx";
import {
  dayKey,
  dayTotals,
  pace,
  paceLine,
  recentDays,
  streak,
  targetFor,
  WEEKDAYS,
  weekdayName,
  weekSentence,
  type Goal,
  type SaveEntry,
} from "./writing-progress.ts";

export type { FormComponent, Goal, SaveEntry };

const n = (value: number) => value.toLocaleString("en-US");
const noSubscribe = () => () => {};

// The device's own zone once hydrated; the server's (`fallback`) before, so hydration matches.
function useDeviceZone(fallback: string): string {
  return useSyncExternalStore(
    noSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || fallback,
    () => fallback,
  );
}

type Day = { day: string; words: number; writingDay: boolean };

// The last days as Enarratio's bar chart, oldest first, with the band at or above today's target;
// the table behind its "Show data" holds the same numbers.
function weekChart(days: Day[], target: number | null, source: string, id: string) {
  const data = days.map((d) => ({ day: weekdayName(d.day).slice(0, 3), words: d.words })).reverse();
  const off = [...new Set(days.filter((d) => !d.writingDay).map((d) => weekdayName(d.day)))];
  const top = Math.max(0, ...days.map((d) => d.words));
  return (width: number, fit?: ChartFit) =>
    barChart({
      data,
      x: "day",
      y: "words",
      width,
      height: 220,
      id,
      title: `Words typed, the last ${days.length} days`,
      subtitle: `${weekdayName(days.at(-1)!.day)} to today`,
      alt: weekSentence(days, target),
      xLabel: "Day",
      yLabel: "Typed",
      yUnit: "words",
      formatValue: n,
      notes: off.length ? `Days off: ${off.join(", ")}.` : undefined,
      source,
      annotations:
        target === null
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

export interface WritingProgressProps {
  // This writer's saves over the streak horizon: when, words typed, words removed.
  entries: SaveEntry[];
  goal: Goal;
  // The project's whole target and its deadline (YYYY-MM-DD), for a deadline's pace.
  projectTarget: number | null;
  deadline: string;
  // The project's words now.
  wordsNow: number;
  // The zone the server counted in (the request's, or UTC). The panel counts again in the device's.
  zone: string;
  // The goal form is shown only to someone who may write here.
  canEdit: boolean;
  // Where the goal form posts, and the router's form. It posts intent=goal, mode, dailyTarget,
  // writingDays (repeated) and allowNegative.
  action?: string;
  Form?: FormComponent;
  // The goal form's answer: the refusal to show, or that it was saved.
  error?: string | null;
  saved?: boolean;
  // A line in the goal form on where the project target and deadline are set.
  goalNote?: ReactNode;
  // What counts as typed, under the figures.
  note?: ReactNode;
  // The chart's source line.
  source?: string;
  title?: ReactNode;
  // How many days the chart shows. Default 7.
  days?: number;
  // A fixed "now", for a test or a specimen. Read once when the panel is drawn.
  now?: Date;
}

// Today's writing: words typed today against today's target, the streak, the pace a deadline asks
// for, the last days as a chart, and the writer's own goal.
export function WritingProgress({
  entries,
  goal,
  projectTarget,
  deadline,
  wordsNow,
  zone: serverZone,
  canEdit,
  action,
  Form = PlainForm,
  error = null,
  saved = false,
  goalNote,
  note = "Pastes, imports and AI drafts you take as your draft do not count. A day runs midnight to midnight on this device.",
  source = "Typed words in the authorship record",
  title = "Today's writing",
  days: dayCount = 7,
  now: fixedNow,
}: WritingProgressProps) {
  const zone = useDeviceZone(serverZone);
  const chartId = `progress-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
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

  return (
    <Panel title={title} src="Typed words only" className="cap-progress">
      <div className="cap-progress-body" data-cap="writing-progress">
        {target !== null ? (
          <Meter
            label="Typed today"
            value={Math.max(0, wordsToday)}
            max={target}
            display={`${n(wordsToday)} of ${n(target)}`}
            valueText={`${n(wordsToday)} of ${n(target)} words typed today.${met ? " Target met." : ""}`}
            tone={met ? "ok" : undefined}
            note={met ? "Today's target is met." : `${n(target - wordsToday)} to go today.`}
          />
        ) : (
          <p className="cap-progress-line">
            <strong>{n(wordsToday)}</strong> word{wordsToday === 1 ? "" : "s"} typed today.{" "}
            <span className="cap-muted">
              {dayOff
                ? "A day off: no target today."
                : goal.mode === "deadline"
                  ? "No pace to work out yet."
                  : "No daily target set."}
            </span>
          </p>
        )}
        {met ? <Status tone="ok">Target met</Status> : null}
        <p className="cap-progress-line">
          Streak: <strong>{run}</strong> day{run === 1 ? "" : "s"} in a row at the target.
          {target === null ? <span className="cap-muted"> A streak needs a target.</span> : null}
        </p>
        {goal.mode === "deadline" || deadline || projectTarget ? (
          <p className="cap-progress-line cap-muted">{paceLine(paced, deadline)}</p>
        ) : null}
        <ChartFrame draw={weekChart(recent, target, source, chartId)} width={360} />
        {note ? <p className="cap-progress-note">{note}</p> : null}
        {error ? (
          <Alert tone="crit">{error}</Alert>
        ) : saved ? (
          <p className="cap-progress-line" role="status">
            Your target is saved.
          </p>
        ) : null}
        {canEdit ? (
          <Disclosure summary="Your target" defaultOpen={Boolean(error)}>
            <Form method="post" action={action} className="cap-progress-form">
              <input type="hidden" name="intent" value="goal" />
              <fieldset className="cap-field">
                <legend className="cap-field-label">Set the daily target</legend>
                <div className="cap-field-options">
                  <Check
                    type="radio"
                    name="mode"
                    value="daily"
                    label="By hand"
                    checked={mode === "daily"}
                    onChange={() => setMode("daily")}
                  />
                  <Check
                    type="radio"
                    name="mode"
                    value="deadline"
                    label="From the deadline"
                    checked={mode === "deadline"}
                    onChange={() => setMode("deadline")}
                  />
                </div>
              </fieldset>
              <Field
                label="Words a day"
                help={
                  mode === "deadline"
                    ? "Used only when you set it by hand."
                    : "Leave empty for no target."
                }
              >
                <input
                  className="cap-input"
                  name="dailyTarget"
                  inputMode="numeric"
                  defaultValue={goal.dailyTarget ?? ""}
                  autoComplete="off"
                />
              </Field>
              {goalNote ? <p className="cap-progress-note">{goalNote}</p> : null}
              <fieldset className="cap-field">
                <legend className="cap-field-label">Writing days</legend>
                <div className="cap-progress-days">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <Check
                      key={d}
                      name="writingDays"
                      value={String(d)}
                      label={WEEKDAYS[d]!}
                      defaultChecked={goal.writingDays.includes(d)}
                    />
                  ))}
                </div>
              </fieldset>
              <Check
                name="allowNegative"
                value="1"
                label="Let deletions take a day below zero"
                defaultChecked={goal.allowNegative}
              />
              <div>
                <Button type="submit">Save my target</Button>
              </div>
            </Form>
          </Disclosure>
        ) : null}
      </div>
    </Panel>
  );
}
