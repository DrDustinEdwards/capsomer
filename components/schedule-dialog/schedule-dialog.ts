// Schedule dialog's pure part: what a chosen datetime-local value means (a time in the future,
// or why it cannot be scheduled). A datetime-local input holds a wall-clock time with no zone; the
// browser reads it in its own zone, which the dialog names.

export interface ScheduleCheck {
  // The instant the value names, in the browser's zone; null when there is none yet.
  at: Date | null;
  // Why it cannot be scheduled, in words, or null when it can.
  problem: string | null;
}

export const NO_TIME = "Choose a time first.";
export const PAST_TIME = "Choose a time in the future.";

// What a datetime-local value means at `now`: past is measured when the time was chosen, so a
// time that passes while the dialog is open is not refused under the person's eyes.
export function checkSchedule(value: string, now: number): ScheduleCheck {
  if (!value) return { at: null, problem: NO_TIME };
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return { at: null, problem: NO_TIME };
  return { at, problem: at.getTime() <= now ? PAST_TIME : null };
}
