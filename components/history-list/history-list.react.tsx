import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useMessage } from "../message/message.react.tsx";
import { attachRowList } from "../row-list/row-list.ts";
import { parse } from "../time/time.ts";
import {
  PICK_BLOCKED,
  compareHref,
  condense,
  deltaOf,
  orderPair,
  pickTwo,
  pickedText,
  restoredEntry,
  restoredMessage,
  stamp,
  type HistoryEntry,
} from "./history-list.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";
import { Line, RunLines } from "./history-list-lines.react.tsx";

export type { HistoryEntry, Destination, HistoryKind } from "./history-list.ts";

export interface RestoreEvent {
  source: HistoryEntry;
  entry: HistoryEntry;
}

export interface HistoryListProps {
  entries: HistoryEntry[];
  labelledBy?: string;
  label?: string;
  user: string;
  // The compare view's path; `?from=<older>&to=<newer>` is added. Before script the pick boxes post
  // `?compare=<id>&compare=<id>` as a GET form; read either with `comparePicks`.
  compareBase?: string;
  // The versions picked when the page is drawn, so a compare page keeps its two ticked.
  defaultPicked?: string[];
  versionHref?: (id: string) => string;
  // Load-into-editor mode: an earlier line links here (works without script) instead of Restore.
  // `onLoad` loads the text in place and stops the navigation.
  loadHref?: (id: string) => string;
  onLoad?: (entry: HistoryEntry) => void;
  // A read-only history: an earlier line has no action. Entries may leave out `words`.
  readOnly?: boolean;
  // Restoring adds a new line on top: add `entry` to `entries` (and save it).
  onRestore?: (e: RestoreEvent) => void | Promise<void>;
  onUndoRestore?: (e: RestoreEvent) => void | Promise<void>;
  now?: number;
  // More lines before the last: an address (works without script) and/or a handler that fetches them.
  olderHref?: string;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  primary?: boolean;
  empty?: ReactNode;
}

export function HistoryList({
  entries,
  labelledBy,
  label,
  user,
  compareBase = "",
  defaultPicked,
  versionHref,
  loadHref,
  onLoad,
  readOnly,
  onRestore,
  onUndoRestore,
  now,
  olderHref,
  onLoadOlder,
  loadingOlder,
  primary,
  empty,
}: HistoryListProps) {
  const prefix = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [picked, setPicked] = useState<string[]>(() =>
    (defaultPicked ?? []).filter((id) => entries.some((e) => e.id === id)).slice(0, 2),
  );
  const hydrated = useHydrated();
  const formId = `${prefix}-compare`;
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { say } = useMessage();
  const noEntries = entries.length === 0;
  useEffect(() => (listRef.current ? attachRowList(listRef.current) : undefined), [noEntries]);
  // A pick no longer in the list (an Undo removed it) is dropped in the same render.
  const [pickedFrom, setPickedFrom] = useState(entries);
  if (entries !== pickedFrom) {
    setPickedFrom(entries);
    setPicked((p) => p.filter((id) => entries.some((e) => e.id === id)));
  }

  const lines = useMemo(() => condense(entries), [entries]);
  const at = (id: string) => parse(entries.find((e) => e.id === id)?.at ?? "");
  const pair = orderPair(picked, at);
  const text =
    note ??
    (pair
      ? pickedText(
          2,
          stamp(entries.find((e) => e.id === pair[0])?.at ?? "", now),
          stamp(entries.find((e) => e.id === pair[1])?.at ?? "", now),
        )
      : pickedText(picked.length));
  const href = versionHref ?? ((id: string) => `?version=${encodeURIComponent(id)}`);

  const pick = (id: string) => {
    const next = pickTwo(picked, id);
    setNote(next.blocked ? PICK_BLOCKED : null);
    if (!next.blocked) setPicked(next.picked);
  };

  const restore = async (source: HistoryEntry, opener: HTMLElement) => {
    const current = entries[0];
    if (!current) return;
    const at = new Date(now ?? Date.now()).toISOString();
    const entry = restoredEntry(
      source,
      current,
      user,
      `${source.id}-restored-${entries.filter((e) => e.kind === "restore").length + 1}`,
      at,
      now,
    );
    const event = { source, entry };
    await onRestore?.(event);
    say(restoredMessage(source, now), {
      undo: async () => {
        await onUndoRestore?.(event);
      },
      undone: "Restore undone.",
      returnFocus: () => (opener.isConnected ? opener : null),
    });
  };

  if (entries.length === 0) return <div className="cap-hist">{empty}</div>;

  const starts: number[] = [];
  let index = 0;
  for (const line of lines) {
    starts.push(index);
    index += line.type === "entry" ? 1 : line.entries.length;
  }
  return (
    <section
      className="cap-hist"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      data-picked={picked.length}
      data-readonly={readOnly ? "" : undefined}
    >
      <div className="cap-hist-bar">
        <p className="cap-hist-picked" role="status" data-cap-part="picked">
          {text}
        </p>
        {/* The pick boxes belong to this form, so before script Compare posts them as a plain GET. */}
        <form id={formId} method="get" action={compareBase || undefined} hidden />
        {!hydrated ? (
          <button
            type="submit"
            form={formId}
            className="cap-btn"
            data-variant="primary"
            data-cap-part="compare-submit"
          >
            Compare 2 versions
          </button>
        ) : pair ? (
          <a
            className="cap-btn"
            data-variant="primary"
            data-cap-part="compare"
            href={compareHref(compareBase, pair[0], pair[1])}
          >
            Compare 2 versions
          </a>
        ) : (
          // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- an <a> with no href has no link role; this disabled link keeps it
          <a
            className="cap-btn"
            data-variant="primary"
            data-cap-part="compare"
            role="link"
            aria-disabled="true"
            tabIndex={0}
          >
            Compare 2 versions
          </a>
        )}
      </div>
      <ul
        ref={listRef}
        className="cap-rows cap-hist-list"
        role="list"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        data-cap-primary={primary ? "" : undefined}
      >
        {lines.map((line, li) => {
          const common = (e: HistoryEntry, i: number) => (
            <Line
              key={e.id}
              entry={e}
              delta={deltaOf(entries, i)}
              prefix={prefix}
              current={i === 0}
              picked={picked.includes(e.id)}
              pickDisabled={picked.length >= 2 && !picked.includes(e.id)}
              formId={formId}
              now={now}
              href={href}
              onPick={pick}
              onRestore={(en, el) => void restore(en, el)}
              loadHref={loadHref}
              onLoad={onLoad}
              readOnly={readOnly}
            />
          );
          if (line.type === "entry") {
            return common(line.entry, starts[li] ?? 0);
          }
          const id = `${prefix}-run-${(line.entries[0] as HistoryEntry).id}`;
          const isOpen = open[id] === true;
          const start = starts[li] ?? 0;
          return (
            <RunLines
              key={id}
              run={line}
              prefix={prefix}
              now={now}
              open={isOpen}
              onToggle={() => setOpen((o) => ({ ...o, [id]: !isOpen }))}
            >
              {line.entries.map((e, k) => common(e, start + k))}
            </RunLines>
          );
        })}
      </ul>
      {olderHref || onLoadOlder ? (
        <div className="cap-hist-foot">
          {olderHref ? (
            <a
              className="cap-btn"
              data-variant="quiet"
              data-cap-part="older"
              href={olderHref}
              aria-busy={loadingOlder || undefined}
              onClick={onLoadOlder ? (e) => (e.preventDefault(), onLoadOlder()) : undefined}
            >
              Load older versions
            </a>
          ) : (
            <button
              type="button"
              className="cap-btn"
              data-variant="quiet"
              data-cap-part="older"
              aria-busy={loadingOlder || undefined}
              onClick={onLoadOlder}
            >
              Load older versions
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
