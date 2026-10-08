import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { GLYPHS } from "../message/message.ts";
import { useMessage } from "../message/message.react.tsx";
import { Time } from "../time/time.react.tsx";
import { initials } from "../avatar/avatar.ts";
import { parse } from "../time/time.ts";
import {
  PICK_BLOCKED,
  attachListKeys,
  SIGN_GLYPH,
  compareHref,
  condense,
  deltaOf,
  deltaSign,
  deltaText,
  destinationGlyph,
  destinationTone,
  destinationWord,
  orderPair,
  pickTwo,
  pickedText,
  rangeText,
  restoredEntry,
  restoredMessage,
  runTitle,
  stamp,
  type HistoryEntry,
  type Run,
} from "./history-list.ts";

export type { HistoryEntry, Destination, HistoryKind } from "./history-list.ts";

export interface RestoreEvent {
  // The line restored from, and the new line a restore adds on top.
  source: HistoryEntry;
  entry: HistoryEntry;
}

export interface HistoryListProps {
  // Newest first. The first is the current version.
  entries: HistoryEntry[];
  // The list's name: the heading id that names it (preferred), or a label.
  labelledBy?: string;
  label?: string;
  // Who is restoring: the new line is theirs.
  user: string;
  // The compare view's path; `?from=<older>&to=<newer>` is added.
  compareBase?: string;
  // Where a line's title goes (the version's own page).
  versionHref?: (id: string) => string;
  // Load-into-editor mode: an earlier line's action is a "Load into editor" link to this
  // address (works without script) in place of Restore. Nothing is added to the history; the
  // app's save makes the version. `onLoad` loads the text in place and stops the navigation.
  loadHref?: (id: string) => string;
  onLoad?: (entry: HistoryEntry) => void;
  // A read-only history: an earlier line has no action, neither Restore nor Load. Entries may
  // leave out `words`; such a line shows no size change.
  readOnly?: boolean;
  // Restoring adds a new line on top: add `entry` to `entries` (and save it). The message with
  // Undo is said by the list.
  onRestore?: (e: RestoreEvent) => void | Promise<void>;
  // Undo of that restore: remove `entry` again.
  onUndoRestore?: (e: RestoreEvent) => void | Promise<void>;
  // A fixed "now" for a report or a test.
  now?: number;
  // More lines exist before the last: an address (a link that works without script) and/or a
  // handler (the app fetches the page and adds it to `entries`).
  olderHref?: string;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  // The page's main list: j and k work on it before focus is inside it.
  primary?: boolean;
  // Shown in place of the list when there are no versions.
  empty?: ReactNode;
}

const Glyph = ({ d, size = 14 }: { d: string; size?: number }) => <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: d }} />;

function Status({ tone, glyph, word }: { tone: string; glyph: string; word: string }) {
  return (
    <span className="cap-status" data-tone={tone}>
      <Glyph d={glyph} />
      {word}
    </span>
  );
}

function Who({ id, name, ai }: { id: string; name: string; ai?: boolean }) {
  return (
    <span className="cap-hist-who" id={id}>
      <span className="cap-avatar" data-size="sm" data-kind={ai ? "ai" : undefined} aria-hidden="true">
        <span className="cap-avatar-fallback">{ai ? "AI" : initials(name.split(" and ")[0] ?? name)}</span>
      </span>
      <span className="cap-hist-name">{name}</span>
    </span>
  );
}

function Delta({ id, n }: { id: string; n: number | undefined }) {
  if (n === undefined) return <span className="cap-hist-delta" data-sign="none" aria-hidden="true" />;
  const sign = deltaSign(n);
  return (
    <span className="cap-hist-delta" id={id} data-sign={sign}>
      <Glyph d={SIGN_GLYPH[sign]} size={12} />
      <span>{deltaText(n)}</span>
    </span>
  );
}

function When({ id, iso, now, chevron }: { id: string; iso: string; now?: number; chevron?: boolean }) {
  return (
    <span className="cap-row-meta" id={id}>
      <span className="cap-hist-when">
        <Time at={iso} now={now} />
        <time className="cap-hist-exact" dateTime={iso}>
          {stamp(iso, now)}
        </time>
      </span>
      {chevron ? <span className="cap-row-chevron" aria-hidden="true" /> : null}
    </span>
  );
}

interface LineProps {
  entry: HistoryEntry;
  delta: number | undefined;
  prefix: string;
  current: boolean;
  picked: boolean;
  pickDisabled: boolean;
  now?: number;
  href: (id: string) => string;
  onPick: (id: string, el: HTMLInputElement) => void;
  onRestore: (e: HistoryEntry, opener: HTMLElement) => void;
  loadHref?: (id: string) => string;
  onLoad?: (e: HistoryEntry) => void;
  readOnly?: boolean;
}

function Line({ entry: e, delta, prefix, current, picked, pickDisabled, now, href, onPick, onRestore, loadHref, onLoad, readOnly }: LineProps) {
  const p = `${prefix}-${e.id}`;
  const stampText = stamp(e.at, now);
  const hasDetail = e.kind !== "edit";
  const described = [hasDetail ? `${p}-d` : "", delta === undefined ? "" : `${p}-w`, `${p}-t`].filter(Boolean).join(" ");
  return (
    <li className="cap-row cap-hist-row" data-kind={e.kind} data-id={e.id} data-at={e.at} data-words={e.words} data-who={e.who} data-current={current ? "" : undefined}>
      <span className="cap-hist-pick">
        <label className="cap-check">
          <input type="checkbox" name="compare" value={e.id} data-cap-part="pick" checked={picked} aria-disabled={pickDisabled ? "true" : undefined} onChange={(ev) => onPick(e.id, ev.currentTarget)} onClick={(ev) => pickDisabled && ev.preventDefault()} />
          <span className="cap-sr-only">
            Compare this version, {stampText}, by {e.who}
          </span>
        </label>
      </span>
      <Who id={`${p}-who`} name={e.who} ai={e.ai} />
      <div className="cap-row-title">
        <a href={href(e.id)} aria-describedby={described} title={e.summary}>
          {e.summary}
        </a>
      </div>
      {e.kind === "named" ? (
        <p className="cap-row-detail" id={`${p}-d`}>
          Named version: <b>{e.name}</b>
        </p>
      ) : e.kind === "publish" ? (
        <p className="cap-row-detail" id={`${p}-d`}>
          Published to{" "}
          {(e.destinations ?? []).map((d) => (
            <span key={d.name} className="cap-hist-dest">
              <Status tone={destinationTone(d.status)} glyph={destinationGlyph(d.status)} word={destinationWord(d.status)} /> {d.name}{" "}
            </span>
          ))}
        </p>
      ) : e.kind === "restore" && e.restoredFrom ? (
        <p className="cap-row-detail" id={`${p}-d`}>
          Restored from {stamp(e.restoredFrom.at, now)}
        </p>
      ) : e.kind === "autosave" ? (
        <p className="cap-row-detail" id={`${p}-d`}>
          Autosave
        </p>
      ) : null}
      <Delta id={`${p}-w`} n={delta} />
      <When id={`${p}-t`} iso={e.at} now={now} />
      <div className="cap-row-actions">
        {current ? (
          <Status tone="ok" glyph={GLYPHS.ok} word="Current" />
        ) : readOnly ? null : loadHref ? (
          <a
            className="cap-btn"
            data-variant="quiet"
            data-size="sm"
            data-cap-part="load"
            data-version={e.id}
            href={loadHref(e.id)}
            onClick={onLoad ? (ev) => (ev.preventDefault(), onLoad(e)) : undefined}
          >
            Load into editor<span className="cap-sr-only"> the version from {stampText} by {e.who}</span>
          </a>
        ) : (
          <button type="button" className="cap-btn" data-variant="quiet" data-size="sm" data-cap-part="restore" data-version={e.id} onClick={(ev) => onRestore(e, ev.currentTarget)}>
            Restore<span className="cap-sr-only"> the version from {stampText} by {e.who}</span>
          </button>
        )}
      </div>
    </li>
  );
}

function RunLines({ run, deltas, prefix, now, open, onToggle, children }: { run: Run; deltas: (number | undefined)[]; prefix: string; now?: number; open: boolean; onToggle: () => void; children: ReactNode }) {
  const first = run.entries[0] as HistoryEntry;
  const p = `${prefix}-run-${first.id}`;
  const title = runTitle(run);
  const names = run.who.length > 1 ? `${run.who[0]} and ${run.who.length - 1} more` : (run.who[0] ?? "");
  void deltas;
  return (
    <>
      <li className="cap-row cap-hist-row" data-kind="run">
        <span className="cap-hist-pick" />
        <Who id={`${p}-who`} name={names} />
        <div className="cap-row-title">
          <button type="button" aria-expanded={open} aria-controls={`${p}-rows`} aria-describedby={`${p}-d ${p}-w ${p}-t`} onClick={onToggle}>
            {title}
          </button>
        </div>
        <p className="cap-row-detail" id={`${p}-d`}>
          {rangeText(run.from, run.to, now)}
        </p>
        <Delta id={`${p}-w`} n={run.delta} />
        <When id={`${p}-t`} iso={run.to} now={now} chevron />
        <div className="cap-row-actions" />
      </li>
      <li className="cap-hist-region" id={`${p}-rows`} hidden={!open}>
        <ul role="list" aria-label={title}>
          {children}
        </ul>
      </li>
    </>
  );
}

export function HistoryList({ entries, labelledBy, label, user, compareBase = "", versionHref, loadHref, onLoad, readOnly, onRestore, onUndoRestore, now, olderHref, onLoadOlder, loadingOlder, primary, empty }: HistoryListProps) {
  const prefix = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { say } = useMessage();
  useEffect(() => (listRef.current ? attachListKeys(listRef.current) : undefined), [entries.length === 0]);
  // A pick that is no longer in the list (an Undo removed it) is dropped.
  useEffect(() => setPicked((p) => p.filter((id) => entries.some((e) => e.id === id))), [entries]);

  const lines = useMemo(() => condense(entries), [entries]);
  const at = (id: string) => parse(entries.find((e) => e.id === id)?.at ?? "");
  const pair = orderPair(picked, at);
  const text = note ?? (pair ? pickedText(2, stamp(entries.find((e) => e.id === pair[0])?.at ?? "", now), stamp(entries.find((e) => e.id === pair[1])?.at ?? "", now)) : pickedText(picked.length));
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
    const entry = restoredEntry(source, current, user, `${source.id}-restored-${entries.filter((e) => e.kind === "restore").length + 1}`, at, now);
    const event = { source, entry };
    await onRestore?.(event);
    say(restoredMessage(source, now), {
      undo: async () => {
        await onUndoRestore?.(event);
      },
      undone: "The restored copy was removed. The earlier version is current again.",
      returnFocus: () => (opener.isConnected ? opener : null),
    });
  };

  if (entries.length === 0) return <div className="cap-hist">{empty}</div>;

  let index = 0;
  return (
    <section className="cap-hist" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} data-picked={picked.length} data-readonly={readOnly ? "" : undefined}>
      <div className="cap-hist-bar">
        <p className="cap-hist-picked" role="status" data-cap-part="picked">
          {text}
        </p>
        {pair ? (
          <a className="cap-btn" data-variant="primary" data-cap-part="compare" href={compareHref(compareBase, pair[0], pair[1])}>
            Compare 2 versions
          </a>
        ) : (
          <a className="cap-btn" data-variant="primary" data-cap-part="compare" role="link" aria-disabled="true" tabIndex={0}>
            Compare 2 versions
          </a>
        )}
      </div>
      <ul ref={listRef} className="cap-rows cap-hist-list" role="list" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} data-cap-primary={primary ? "" : undefined}>
        {lines.map((line) => {
          const common = (e: HistoryEntry, i: number) => (
            <Line key={e.id} entry={e} delta={deltaOf(entries, i)} prefix={prefix} current={i === 0} picked={picked.includes(e.id)} pickDisabled={picked.length >= 2 && !picked.includes(e.id)} now={now} href={href} onPick={pick} onRestore={(en, el) => void restore(en, el)} loadHref={loadHref} onLoad={onLoad} readOnly={readOnly} />
          );
          if (line.type === "entry") {
            const node = common(line.entry, index);
            index += 1;
            return node;
          }
          const start = index;
          index += line.entries.length;
          const id = `${prefix}-run-${(line.entries[0] as HistoryEntry).id}`;
          const isOpen = open[id] === true;
          return (
            <RunLines
              key={id}
              run={line}
              deltas={line.entries.map((_e, k) => deltaOf(entries, start + k))}
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
            <a className="cap-btn" data-variant="quiet" data-cap-part="older" href={olderHref} aria-busy={loadingOlder || undefined} onClick={onLoadOlder ? (e) => (e.preventDefault(), onLoadOlder()) : undefined}>
              Load older versions
            </a>
          ) : (
            <button type="button" className="cap-btn" data-variant="quiet" data-cap-part="older" aria-busy={loadingOlder || undefined} onClick={onLoadOlder}>
              Load older versions
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
