import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { initials } from "../avatar/avatar.ts";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { useMessage } from "../message/message.react.tsx";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { openShortcutSheet, register } from "../shortcuts/shortcuts.ts";
import { Time } from "../time/time.react.tsx";
import {
  ACTION_KEY,
  EMPTY_TEXT,
  QUEUE_SHORTCUTS,
  VIEWS,
  VIEW_LABEL,
  actionLabel,
  actionsFor,
  countViews,
  decide,
  decidedText,
  expiredIds,
  isTypingKey,
  needsConfirm,
  retentionNote,
  statusOf,
  summaryText,
  undoStack,
  undoneText,
  viewOf,
  type Mention,
  type ModAction,
  type ModState,
  type ModView,
  type UndoEntry,
} from "./moderation-queue.ts";

export type { Mention, ModAction, ModState, ModView } from "./moderation-queue.ts";

export interface DecidedEvent {
  ids: string[];
  action: ModAction;
  from: Record<string, ModState>;
  to: Record<string, ModState>;
}

export interface ModerationQueueProps {
  // Every mention, in the order to show them. The queue keeps its own copy of the states
  // while it is open and tells the app what changed.
  items: Mention[];
  labelledBy?: string;
  label?: string;
  // Called after each decision (and after each Undo, with the reversed states): save it.
  onDecide?: (e: DecidedEvent) => void | Promise<void>;
  // Called after permanent deletion (a confirm dialog) and the retention sweep.
  onDelete?: (ids: string[]) => void | Promise<void>;
  // A fixed "now" for a report or a test.
  now?: number;
  // The page's main list: j and k work on it before focus is inside it.
  primary?: boolean;
  initialView?: ModView;
  // False where the credential may not delete: the Bin then has no Delete permanently, and
  // retention empties it.
  canDelete?: boolean;
}

const Glyph = ({ d, size = 14 }: { d: string; size?: number }) => <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: d }} />;

function Status({ view }: { view: ModView }) {
  const s = statusOf(view);
  return (
    <span className="cap-status" data-tone={s.tone}>
      <Glyph d={s.glyph} />
      {s.word}
    </span>
  );
}

function ActionButton({ state, action, who, bar, onClick }: { state: ModState; action: ModAction; who: string; bar?: boolean; onClick: () => void }) {
  const key = ACTION_KEY[action];
  return (
    <button type="button" className="cap-btn" data-variant="quiet" data-size="sm" data-cap-action={action} aria-keyshortcuts={key} onClick={onClick}>
      {actionLabel(state, action)}
      {bar ? null : <span className="cap-sr-only"> the mention from {who}</span>}
      <kbd className="cap-kbd" aria-hidden="true">
        {key}
      </kbd>
    </button>
  );
}

export function ModerationQueue({ items: initial, labelledBy, label, onDecide, onDelete, now, primary, initialView = "waiting", canDelete = true }: ModerationQueueProps) {
  const id = useId();
  const { say } = useMessage();
  const listRef = useRef<HTMLUListElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Mention[]>(initial);
  const [view, setView] = useState<ModView>(initialView);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const stack = useRef(undoStack<UndoEntry>());
  const focusId = useRef<string | null>(null);
  const latest = useRef({ items, view, selected });
  latest.current = { items, view, selected };
  const clock = now ?? Date.now();

  const counts = useMemo(() => countViews(items), [items]);
  const shown = useMemo(() => items.filter((m) => viewOf(m) === view), [items, view]);
  const expired = useMemo(() => expiredIds(items, clock), [items, clock]);

  // After a render that removed the row that had focus, focus goes where the person was heading.
  useEffect(() => {
    const want = focusId.current;
    if (want === null) return;
    focusId.current = null;
    const target = want === "" ? emptyRef.current : listRef.current?.querySelector<HTMLElement>(`[data-id='${CSS.escape(want)}'] .cap-row-title button`);
    target?.focus();
  });

  useEffect(() => {
    const offs = QUEUE_SHORTCUTS.map((s) => register({ ...s, group: "Moderation queue", when: () => false, run: () => {} }));
    return () => offs.forEach((f) => f());
  }, []);

  const apply = useCallback(
    (ids: string[], action: ModAction, opts: { focusNext?: boolean } = {}) => {
      const { items: all } = latest.current;
      const moved = all.filter((m) => ids.includes(m.id) && decide(m.state, action));
      if (moved.length === 0) return;
      const decidedAt = new Date(clock).toISOString();
      const from: UndoEntry["from"] = Object.fromEntries(moved.map((m) => [m.id, { state: m.state, decidedAt: m.decidedAt }]));
      const to = Object.fromEntries(moved.map((m) => [m.id, decide(m.state, action) as ModState]));
      if (opts.focusNext) {
        const visibleIds = all.filter((m) => viewOf(m) === latest.current.view).map((m) => m.id);
        const last = visibleIds.reduce((at, vid, i) => (ids.includes(vid) ? i : at), -1);
        const first = visibleIds.findIndex((vid) => ids.includes(vid));
        const after = visibleIds.slice(last + 1).find((vid) => !ids.includes(vid));
        const before = visibleIds.slice(0, Math.max(first, 0)).reverse().find((vid) => !ids.includes(vid));
        focusId.current = after ?? before ?? "";
      }
      setItems((cur) => cur.map((m) => (to[m.id] ? { ...m, state: to[m.id] as ModState, decidedAt: to[m.id] === "waiting" ? undefined : decidedAt } : m)));
      setSelected((cur) => cur.filter((sid) => !ids.includes(sid)));
      const entry: UndoEntry = { ids: moved.map((m) => m.id), who: moved.map((m) => m.author || "An unnamed sender"), action, from };
      stack.current.push(entry);
      void onDecide?.({ ids: entry.ids, action, from: Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v.state])), to });
      const undoThen = (e: UndoEntry): (() => void) => () => {
        stack.current.remove((x) => x === e);
        setItems((cur) => cur.map((m) => (e.from[m.id] ? { ...m, state: e.from[m.id]?.state as ModState, decidedAt: e.from[m.id]?.decidedAt } : m)));
        focusId.current = e.ids[0] ?? null;
        void onDecide?.({ ids: e.ids, action: "restore", from: {}, to: Object.fromEntries(e.ids.map((i) => [i, e.from[i]?.state as ModState])) });
        const prior = stack.current.peek();
        if (prior) say(`${undoneText(e.who)} Earlier: ${decidedText(prior.action, prior.who)}`, { undo: undoThen(prior) });
        else say(undoneText(e.who));
      };
      say(decidedText(action, entry.who), { undo: undoThen(entry) });
    },
    [clock, onDecide, say],
  );

  const run = useCallback(
    async (ids: string[], action: ModAction | "delete", focusNext: boolean) => {
      const { items: all } = latest.current;
      const rows = all.filter((m) => ids.includes(m.id));
      if (action === "delete") {
        const doomed = rows.filter((m) => m.state === "bin");
        if (doomed.length === 0) return;
        const one = doomed.length === 1;
        const ok = await confirm({
          title: one ? `Delete the mention from ${doomed[0]?.author || "An unnamed sender"} permanently?` : `Delete ${doomed.length} mentions permanently?`,
          lead: "This cannot be undone.",
          body: [one ? "This removes the only copy of it. Nothing else has one." : "This removes the only copy of each. Nothing else has one."],
          action: "Delete permanently",
          perform: async () => {
            const gone = doomed.map((m) => m.id);
            setItems((cur) => cur.filter((m) => !gone.includes(m.id)));
            setSelected((cur) => cur.filter((s) => !gone.includes(s)));
            stack.current.remove((e) => e.ids.some((i) => gone.includes(i)));
            await onDelete?.(gone);
            say(one ? `Deleted the mention from ${doomed[0]?.author || "An unnamed sender"} permanently.` : `Deleted ${doomed.length} mentions permanently.`);
          },
        });
        void ok;
        return;
      }
      if (action === "approve") {
        const ask = rows.filter((m) => needsConfirm(m, "approve") && decide(m.state, "approve"));
        if (rows.length === 1 && ask.length === 1 && ask[0]) {
          const only = ask[0];
          await confirm({
            title: `Approve the mention from ${only.author || "An unnamed sender"}?`,
            lead: "Its source page no longer exists, and nobody can check it any more.",
            body: ["Its excerpt would show on the post within seconds.", "You can take it down again from Approved."],
            action: "Approve anyway",
            perform: async () => apply([only.id], "approve", { focusNext }),
          });
          return;
        }
        const rest = rows.filter((m) => !ask.includes(m));
        apply(rest.map((m) => m.id), "approve", { focusNext });
        if (ask.length) {
          const n = ask.length;
          say(`${rest.length ? `Approved ${rest.length}. ` : ""}${n} with a source gone ${n === 1 ? "was" : "were"} left selected: approve ${n === 1 ? "it" : "them"} one at a time.`);
        }
        return;
      }
      apply(ids, action, { focusNext });
    },
    [apply, onDelete, say],
  );

  const sweep = async () => {
    const doomed = items.filter((m) => expired.includes(m.id));
    if (doomed.length === 0) return;
    const c = countViews(doomed);
    await confirm({
      title: `Remove ${doomed.length} expired mention${doomed.length === 1 ? "" : "s"}?`,
      lead: "This cannot be undone. Nothing that is still waiting or approved is touched.",
      body: [c.gone ? `${c.gone} whose source is gone` : "", c.spam ? `${c.spam} marked as spam` : "", c.bin ? `${c.bin} in the bin` : ""].filter(Boolean),
      action: "Remove them",
      perform: async () => {
        setItems((cur) => cur.filter((m) => !expired.includes(m.id)));
        stack.current.remove((e) => e.ids.some((i) => expired.includes(i)));
        await onDelete?.(expired);
        say(`Removed ${doomed.length} expired mention${doomed.length === 1 ? "" : "s"}.`);
      },
    });
  };

  // The keys: the row under focus, or the selection when that row is part of it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const list = listRef.current;
      if (e.defaultPrevented || !list || isTypingKey(e) || singleKeysOff() || e.repeat) return;
      if (e.key === "j" || e.key === "k") {
        if (!listOwnsKeys(list)) return;
        if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement)) e.preventDefault();
        return;
      }
      if (!["a", "s", "d", "r", "x"].includes(e.key)) return;
      const row = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(".cap-mq-row");
      if (!row || !list.contains(row) || document.querySelector("dialog:modal")) return;
      e.preventDefault();
      const rid = row.dataset.id ?? "";
      if (e.key === "x") return setSelected((cur) => (cur.includes(rid) ? cur.filter((s) => s !== rid) : [...cur, rid]));
      const action = (Object.keys(ACTION_KEY) as ModAction[]).find((a) => ACTION_KEY[a] === e.key);
      if (!action) return;
      const { items: all, selected: sel } = latest.current;
      const ids = sel.includes(rid) ? sel : [rid];
      if (ids.every((i) => !decide(all.find((m) => m.id === i)?.state ?? "bin", action))) return;
      void run(ids, action, true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [run]);

  const pickedHere = selected.filter((s) => shown.some((m) => m.id === s));
  const barState: ModState = view === "gone" ? "waiting" : view;
  const empty = EMPTY_TEXT[view];

  return (
    <section className="cap-mq" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label}>
      <div className="cap-mq-head">
        <fieldset className="cap-seg">
          <legend className="cap-sr-only">Show mentions that are</legend>
          <div className="cap-seg-options">
            {VIEWS.map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  name={`${id}-view`}
                  value={v}
                  checked={view === v}
                  onChange={() => {
                    setView(v);
                    setSelected([]);
                  }}
                />{" "}
                {VIEW_LABEL[v]}{" "}
                <span className="cap-mq-count">
                  {counts[v]}
                  <span className="cap-sr-only"> mentions</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="cap-mq-summary" role="status">
          {summaryText(counts)}
        </p>
        <button type="button" className="cap-btn" data-variant="quiet" data-size="sm" aria-keyshortcuts="?" onClick={(e) => openShortcutSheet(e.currentTarget)}>
          Keyboard shortcuts{" "}
          <kbd className="cap-kbd" aria-hidden="true">
            ?
          </kbd>
        </button>
      </div>
      <div className="cap-mq-tools">
        <label className="cap-check">
          <input
            type="checkbox"
            ref={(el) => {
              if (el) el.indeterminate = pickedHere.length > 0 && pickedHere.length < shown.length;
            }}
            checked={shown.length > 0 && pickedHere.length === shown.length}
            onChange={(e) => setSelected(e.currentTarget.checked ? shown.map((m) => m.id) : [])}
          />
          <span>{shown.length === 0 ? "Select all" : `Select all ${shown.length} shown`}</span>
        </label>
        <div className="cap-bulk" data-cap="bulk-bar" role="region" aria-label="Bulk actions" data-empty={pickedHere.length === 0 ? "" : undefined}>
          <p className="cap-bulk-count" role="status">
            {pickedHere.length === 0 ? "No rows selected" : `${pickedHere.length} selected`}
          </p>
          <div className="cap-bulk-actions" hidden={pickedHere.length === 0}>
            {pickedHere.length > 0 && actionsFor(barState).map((a) => <ActionButton key={a} state={barState} action={a} who="" bar onClick={() => void run(pickedHere, a, true)} />)}
            {pickedHere.length > 0 && barState === "bin" && canDelete ? (
              <button type="button" className="cap-btn" data-variant="danger" data-size="sm" data-cap-action="delete" onClick={() => void run(pickedHere, "delete", true)}>
                Delete permanently
              </button>
            ) : null}
          </div>
          <button type="button" className="cap-btn cap-bulk-clear" data-variant="quiet" hidden={pickedHere.length === 0} onClick={() => setSelected([])}>
            Clear selection
          </button>
        </div>
      </div>
      <div ref={emptyRef} className="cap-empty cap-mq-empty" data-kind={view === "waiting" ? "all-clear" : "nothing-yet"} tabIndex={-1} hidden={shown.length > 0}>
        <div className="cap-empty-header">
          <p className="cap-empty-title">{empty.title}</p>
          <p className="cap-empty-text">{empty.text}</p>
        </div>
      </div>
      <ul ref={listRef} className="cap-rows cap-mq-list" role="list" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} data-cap-primary={primary ? "" : undefined} hidden={shown.length === 0}>
        {items.map((m) => {
          const v = viewOf(m);
          const who = m.author || "An unnamed sender";
          const p = `${id}-${m.id}`;
          const isOpen = open.includes(m.id);
          const checked = selected.includes(m.id);
          return (
            <li key={m.id} className="cap-row cap-mq-row" data-id={m.id} data-state={m.state} data-view={v} data-selected={checked ? "" : undefined} hidden={v !== view}>
              <span className="cap-mq-check">
                <label className="cap-check">
                  <input type="checkbox" checked={checked} onChange={() => setSelected((cur) => (cur.includes(m.id) ? cur.filter((s) => s !== m.id) : [...cur, m.id]))} />
                  <span className="cap-sr-only">Select the mention from {who}</span>
                </label>
              </span>
              <span className="cap-row-status" id={`${p}-s`}>
                <Status view={v} />
                {m.gone && v !== "gone" ? (
                  <>
                    {" "}
                    <Status view="gone" />
                  </>
                ) : null}
              </span>
              <div className="cap-row-title">
                <button type="button" aria-expanded={isOpen} aria-controls={`${p}-more`} aria-describedby={`${p}-s ${p}-d`} onClick={() => setOpen((cur) => (isOpen ? cur.filter((o) => o !== m.id) : [...cur, m.id]))}>
                  <span className="cap-avatar" data-size="sm" aria-hidden="true">
                    <span className="cap-avatar-fallback">{m.author ? initials(m.author) : "?"}</span>
                  </span>{" "}
                  <span className="cap-mq-name">{who}</span> <span className="cap-mq-host">{m.host}</span>
                </button>
              </div>
              <p className="cap-row-detail" id={`${p}-d`}>
                On {m.post}: {"“"}
                {m.excerpt}
                {"”"}
              </p>
              <span className="cap-row-meta">
                <Time at={m.at} now={now} />
                <span className="cap-row-chevron" aria-hidden="true" />
              </span>
              <div className="cap-row-actions">
                {actionsFor(m.state).map((a) => (
                  <ActionButton key={a} state={m.state} action={a} who={who} onClick={() => void run([m.id], a, true)} />
                ))}
                {m.state === "bin" && canDelete ? (
                  <button type="button" className="cap-btn" data-variant="danger" data-size="sm" data-cap-action="delete" onClick={() => void run([m.id], "delete", true)}>
                    Delete permanently<span className="cap-sr-only"> the mention from {who}</span>
                  </button>
                ) : null}
              </div>
              <div className="cap-mq-more" id={`${p}-more`} hidden={!isOpen}>
                <blockquote className="cap-mq-quote">{m.excerpt}</blockquote>
                <dl className="cap-mq-facts">
                  <dt>From</dt>
                  <dd>{who}</dd>
                  <dt>Source</dt>
                  <dd>
                    {m.external && m.url ? (
                      <a href={m.url} rel="nofollow ugc noopener" data-external>
                        {m.url}
                      </a>
                    ) : (
                      <span className="cap-mono">{m.url ?? m.host}</span>
                    )}
                  </dd>
                  <dt>On</dt>
                  <dd>{m.postHref ? <a href={m.postHref}>{m.post}</a> : m.post}</dd>
                  <dt>Received</dt>
                  <dd>
                    <Time at={m.at} format="exact" />
                  </dd>
                  {m.decidedAt ? (
                    <>
                      <dt>Decided</dt>
                      <dd>
                        <Time at={m.decidedAt} format="exact" />
                      </dd>
                    </>
                  ) : null}
                </dl>
                {m.gone ? (
                  <p className="cap-mq-why">
                    <b>Source gone.</b> The page no longer exists. Its excerpt is kept, and the mention can still be approved or binned. Approving asks first, because nobody can check it any more.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="cap-mq-retention">
        <p id={`${id}-ret`}>{retentionNote()}</p>
        <button type="button" className="cap-btn" aria-describedby={`${id}-ret`} aria-disabled={expired.length === 0 ? "true" : undefined} onClick={() => expired.length > 0 && void sweep()}>
          Remove {expired.length} expired
        </button>
      </div>
    </section>
  );
}
