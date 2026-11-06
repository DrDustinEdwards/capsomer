// Agent session rows: the order they are shown in (waiting on you first) and the answer
// buttons of an ask block, which announce a typed event for the app to act on. No framework;
// the React wrapper uses the same functions.

export type SessionState = "needs" | "failed" | "working" | "idle" | "stopped";

// The word and tone of each state's pill. Stopped shares the no-data tone with Idle and
// differs from it by its glyph (a filled square) and its word.
export const STATES: Record<SessionState, { word: string; tone: "warn" | "crit" | "info" | "nodata"; glyph: "warn" | "crit" | "run" | "none" | "stop" }> = {
  needs: { word: "Needs you", tone: "warn", glyph: "warn" },
  failed: { word: "Failed", tone: "crit", glyph: "crit" },
  working: { word: "Working", tone: "info", glyph: "run" },
  idle: { word: "Idle", tone: "nodata", glyph: "none" },
  stopped: { word: "Stopped", tone: "nodata", glyph: "stop" },
};

const RANK: Record<SessionState, number> = { needs: 0, failed: 1, working: 2, idle: 3, stopped: 4 };

// Waiting on you first, the longest wait at the top; then failed, working, idle and
// stopped, each with the most recent first. `since` is a time in milliseconds: when the
// session began waiting, failed, started or was last seen. Returns a new array.
export function order<T extends { state: SessionState; since: number }>(sessions: readonly T[]): T[] {
  return [...sessions].sort((a, b) => {
    const r = RANK[a.state] - RANK[b.state];
    if (r !== 0) return r;
    return a.state === "needs" ? a.since - b.since : b.since - a.since;
  });
}

// How a collapsed run of repeated steps is spoken: "Read file 12 times". The eye reads
// "Read file ×12".
export function spokenCount(count: number): string {
  return count === 1 ? "once" : `${count} times`;
}

export interface AnswerDetail {
  session: string;
  answer: string;
}

// Attaches to every [data-cap="session-row"] list under root. A click (or Enter or Space)
// on a button with data-cap-answer inside a row with data-session dispatches a bubbling
// "cap-answer" event with { session, answer }; the app performs the answer and sets the
// button's aria-busy while it is in flight. A busy or aria-disabled button does nothing.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const list of root.querySelectorAll<HTMLElement>("[data-cap='session-row']:not([data-cap-ready])")) {
    list.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>("[data-cap-answer]");
      if (!btn || !list.contains(btn)) return;
      if (btn.getAttribute("aria-busy") === "true" || btn.getAttribute("aria-disabled") === "true") return;
      const row = btn.closest<HTMLElement>("[data-session]");
      const detail: AnswerDetail = { session: row?.dataset.session ?? "", answer: btn.dataset.capAnswer ?? "" };
      btn.dispatchEvent(new CustomEvent<AnswerDetail>("cap-answer", { bubbles: true, detail }));
    };
    list.addEventListener("click", onClick);
    undo.push(() => {
      list.removeEventListener("click", onClick);
      delete list.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
