// The command menu's data and pure helpers: the Command, the page and stop commands, the typed words marked, the
// recent list and the empty words (command-menu.ts has the dialog).
import { groupBy } from "../listbox/listbox.ts";
import { readStored, writeStored } from "../hooks/hooks.ts";

export interface Command {
  id: string;
  label: string;
  group: string;
  // Other words that find it: "home" finds Overview.
  keywords?: string[];
  // The registry's spec: "g o", "r", "Mod+k". Shown in <kbd>; registering it is the app's job.
  shortcut?: string | string[];
  // A short note beside the label, in words, for what the command will do or ask: "asks a
  // reason", "preview first", an item's state. Read by a screen reader after the label.
  hint?: string;
  // A line under the label from a search result's text: the words around the match, with the
  // typed words marked.
  snippet?: string;
  // On a Recent entry, the id of the command it repeats (what is remembered).
  of?: string;
  run: () => void;
}

// Commands that go to each page of an app's menu ("Go to Media"), found by their group too, so
// the menu and the command menu never list different pages. `go` is the router's navigate.
export function navCommands(
  nav: ReadonlyArray<{ id: string; label: string; href: string; group?: string }>,
  go: (href: string) => void,
  group = "Go to",
): Command[] {
  return nav.map((e) => ({
    id: `go-${e.id}`,
    label: `Go to ${e.label}`,
    group,
    keywords: e.group ? [e.group, e.label] : [e.label],
    run: () => go(e.href),
  }));
}

// A text's pieces with the typed words marked, for a snippet: every case-insensitive match of
// a word of the query, longest words first, never overlapping.
export function markQuery(text: string, query: string): Array<{ text: string; mark: boolean }> {
  const words = [
    ...new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1),
    ),
  ].sort((a, b) => b.length - a.length);
  if (!words.length) return [{ text, mark: false }];
  const lower = text.toLowerCase();
  const out: Array<{ text: string; mark: boolean }> = [];
  let at = 0;
  while (at < text.length) {
    let next = -1;
    let len = 0;
    for (const w of words) {
      const i = lower.indexOf(w, at);
      if (i >= 0 && (next < 0 || i < next || (i === next && w.length > len))) {
        next = i;
        len = w.length;
      }
    }
    if (next < 0) {
      out.push({ text: text.slice(at), mark: false });
      break;
    }
    if (next > at) out.push({ text: text.slice(at, next), mark: false });
    out.push({ text: text.slice(next, next + len), mark: true });
    at = next + len;
  }
  return out;
}

// The commands a person ran last, newest first, kept per site in localStorage under `key`
// (ids only; a command no longer offered drops out). Shown, as "Recent", while nothing is typed.
export const RECENT_MAX = 5;
export function readRecent(key: string): string[] {
  try {
    const v = JSON.parse(readStored(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function rememberRecent(key: string, id: string): string[] {
  const next = [id, ...readRecent(key).filter((x) => x !== id)].slice(0, RECENT_MAX);
  writeStored(key, JSON.stringify(next));
  return next;
}

// Every way to stop something lives in one group, so typing "stop" lists them all. A stop
// command opens the control it stands for (a switch's reason field, the confirm dialog) and
// never performs anything itself. List a stop only while there is something to stop. There is
// no "stop everything" command.
export const STOP_GROUP = "Stop";
export const STOP_HINTS = { reason: "asks a reason", preview: "preview first" } as const;

// A stop command: group Stop, found by "stop" and "pause", its hint saying what opening it
// will ask for. `run` must only open the control.
export function stopCommand(o: {
  id: string;
  label: string;
  ask: keyof typeof STOP_HINTS;
  keywords?: string[];
  run: () => void;
}): Command {
  return {
    id: o.id,
    label: o.label,
    group: STOP_GROUP,
    keywords: ["stop", "pause", ...(o.keywords ?? [])],
    hint: STOP_HINTS[o.ask],
    run: o.run,
  };
}

// Commands by group, in the order each group first appears.
export function groupCommands<T extends { group: string }>(
  commands: T[],
): Array<{ group: string; items: T[] }> {
  return groupBy(commands, (c) => c.group);
}

export function emptyText(query: string): string {
  return `No commands match “${query.trim()}”`;
}

// What the empty status says while a live search (the React menu's `search`) has not answered.
export const SEARCHING = "Searching…";
