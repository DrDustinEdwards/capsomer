// Mounts the specimens: WritingProgress on a week of invented saves, with a fixed "now" so the
// figures are the same on every run.
import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { WritingProgress, type Goal, type SaveEntry } from "./writing-progress.react.tsx";

// Tuesday 10 November 2026, 15:00 UTC.
const NOW = new Date("2026-11-10T15:00:00Z");
const day = (d: number, typed: number, removed = 0): SaveEntry => ({
  at: `2026-11-${String(d).padStart(2, "0")}T14:00:00Z`,
  typed,
  removed,
});
const WEEK: SaveEntry[] = [
  day(4, 620),
  day(5, 540, 40),
  day(6, 710),
  day(7, 0),
  day(8, 0),
  day(9, 515),
  day(10, 320),
];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
const byHand: Goal = {
  mode: "daily",
  dailyTarget: 500,
  writingDays: WEEKDAYS,
  allowNegative: false,
};
const fromDeadline: Goal = {
  mode: "deadline",
  dailyTarget: null,
  writingDays: EVERY_DAY,
  allowNegative: false,
};
const none: Goal = {
  mode: "daily",
  dailyTarget: null,
  writingDays: EVERY_DAY,
  allowNegative: false,
};
const base = { projectTarget: null, deadline: "", wordsNow: 41_200, zone: "UTC", now: NOW };
const note = (
  <>
    The project target and deadline are set on the <a href="#title-page">title page</a>.
  </>
);

const mounts: Record<string, () => ReactElement> = {
  target: () => <WritingProgress {...base} entries={WEEK} goal={byHand} canEdit goalNote={note} />,
  met: () => (
    <WritingProgress
      {...base}
      entries={[...WEEK, day(10, 400)]}
      goal={fromDeadline}
      projectTarget={50_000}
      deadline="2026-12-31"
      canEdit
      saved
    />
  ),
  none: () => <WritingProgress {...base} entries={WEEK} goal={none} canEdit={false} />,
  error: () => (
    <WritingProgress
      {...base}
      entries={WEEK}
      goal={byHand}
      canEdit
      error="Give the daily target as a whole number of words from 1 to 100,000, or leave it empty."
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
