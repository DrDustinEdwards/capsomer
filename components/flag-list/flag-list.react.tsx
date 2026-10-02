import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { fail as plainFail, say as plainSay, type SayOptions } from "../message/message.ts";
import { attachRowList } from "../row-list/row-list.ts";
import { Glyph } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { anchorStatus, appliable, applySuggestion, countFlags, groupFlags, revertSuggestion, summaryLine, type AnchorStatus, type Flag as FlagData, type FlagKind, type Resolution } from "./flag-list.ts";

export type { AnchorStatus, Flag as FlagData, FlagKind, Resolution } from "./flag-list.ts";

type FilterValue = "open" | "resolved" | "all";

export interface FlagListProps {
  // The list's heading: "Flags on this draft".
  label: ReactNode;
  flags: FlagData[];
  // Called with the whole new list after a flag is resolved, dismissed, reopened or applied.
  onFlagsChange?: (flags: FlagData[]) => void;
  // The current text the anchors are read against, and how to write it back. Without `text`
  // the flags' own `anchor.lost` marks are believed and Apply is not offered.
  text?: string;
  onTextChange?: (text: string) => void;
  // The owner may apply suggestions; nobody else is offered the button.
  owner?: boolean;
  ownerName?: string;
  // Who is resolving: written on the flag.
  viewer?: string;
  // Where results are said, with Undo. Pass useMessage().say and .fail; without them the
  // plain behaviour module's region (an element with data-cap="message") is used.
  say?: (text: string, opts?: SayOptions) => void;
  fail?: (text: string) => void;
  filter?: FilterValue;
  // Make j and k work before focus is inside the list.
  primary?: boolean;
}

const WORDS: Record<Resolution, string> = { resolved: "Resolved", dismissed: "Dismissed", applied: "Applied" };

export interface FlagProps {
  flag: FlagData;
  anchor: AnchorStatus;
  owner: boolean;
  ownerName?: string;
  // The row's id prefix, so ids are unique when several lists are on a page.
  idPrefix: string;
  onResolve: () => void;
  onDismiss: () => void;
  onReopen: () => void;
  onApply: () => void;
  // A router's link component for the passage link; a plain <a> by default.
  now?: number;
}

// One flag as a row of the row list. Renders exactly the contract on the doc page.
export function Flag({ flag, anchor, owner, ownerName, idPrefix, onResolve, onDismiss, onReopen, onApply, now }: FlagProps) {
  const id = `${idPrefix}-${flag.id}`;
  const open = flag.state === "open";
  const r: Resolution = flag.resolution ?? "resolved";
  const a = flag.anchor;
  const crit = flag.kind === "blocking";
  const sug = flag.suggestion;
  const applied = !open && r === "applied";
  const attrs: Record<string, string | undefined> = {
    "data-flag": flag.id,
    "data-kind": flag.kind,
    "data-state": flag.state,
    "data-anchor": a ? anchor : "none",
    "data-anchor-id": a?.id,
    "data-resolution": open ? undefined : r,
    "data-resolved-by": open ? undefined : flag.resolvedBy,
    "data-resolved-at": open ? undefined : flag.resolvedAt,
    "data-tone": crit && open ? "crit" : undefined,
  };
  const message = <span className="cap-flag-message">{flag.message}</span>;
  return (
    <li className="cap-row cap-flag" id={id} {...attrs}>
      <span className="cap-row-status" id={`${id}-s`}>
        <span className="cap-status" data-tone={crit ? "crit" : "warn"}>
          <Glyph name={crit ? "crit" : "warn"} />
          {crit ? "Blocking" : "Advisory"}
        </span>
      </span>
      <div className="cap-row-title">
        {a && anchor === "found" ? (
          <a href={`#${a.id}`} aria-describedby={`${id}-s ${id}-d`}>
            {message}
            {" "}
            <span className="cap-flag-goto">{a.label ?? "Go to passage"}</span>
          </a>
        ) : (
          <span className="cap-flag-title">
            {message}
            {a ? (
              <>
                {" "}
                <span className="cap-status" data-tone="nodata">
                  <Glyph name="nodata" />
                  Anchor lost
                </span>
              </>
            ) : null}
          </span>
        )}
      </div>
      <p className="cap-row-detail" id={`${id}-d`}>
        {flag.raisedBy ? `${flag.raisedBy}. ` : ""}Cause: <span data-cap-part="cause">{flag.cause}</span>
      </p>
      <span className="cap-row-meta">
        {open ? null : (
          <span className="cap-status" data-tone={r === "dismissed" ? "nodata" : "ok"}>
            <Glyph name={r === "dismissed" ? "nodata" : "ok"} />
            {WORDS[r]}
          </span>
        )}
      </span>
      <div className="cap-row-actions">
        {open ? (
          <>
            <button type="button" className="cap-btn" data-size="sm" data-cap-part="resolve" onClick={onResolve}>
              Resolve<span className="cap-sr-only"> flag: {flag.message}</span>
            </button>
            <button type="button" className="cap-btn" data-size="sm" data-variant="quiet" data-cap-part="dismiss" onClick={onDismiss}>
              Dismiss<span className="cap-sr-only"> flag: {flag.message}</span>
            </button>
          </>
        ) : (
          <button type="button" className="cap-btn" data-size="sm" data-cap-part="reopen" onClick={onReopen}>
            Reopen<span className="cap-sr-only"> flag: {flag.message}</span>
          </button>
        )}
      </div>
      <div className="cap-flag-body">
        {a ? (
          <blockquote className="cap-flag-quote">
            <p className="cap-flag-anchor-note" data-cap-part="anchor-note" hidden={anchor === "none"}>
              {anchor === "lost" ? "The text this flag was raised on changed or was removed. Last known text:" : "Raised on this passage:"}
            </p>
            <p>
              <span className="cap-sr-only">Quoted passage: </span>
              <q className="cap-flag-quote-text">{a.quote}</q>
            </p>
          </blockquote>
        ) : null}
        {sug && a ? (
          <div className="cap-flag-suggestion" data-state={applied ? "applied" : "inert"}>
            <p className="cap-flag-suggestion-head">Suggested by {sug.by ?? "a reviewer"}</p>
            <div className="cap-flag-diff">
              <del>
                <span className="cap-flag-mark" aria-hidden="true">
                  &minus;
                </span>
                <span className="cap-sr-only">Before: </span>
                {a.quote}
              </del>
              <ins>
                <span className="cap-flag-mark" aria-hidden="true">
                  +
                </span>
                <span className="cap-sr-only">After: </span>
                <span className="cap-flag-after-text">{sug.replacement}</span>
              </ins>
            </div>
            <div className="cap-flag-suggestion-foot" data-cap-part="suggestion-foot">
              {applied ? (
                <p className="cap-flag-note">Applied to the draft.</p>
              ) : !open ? (
                <p className="cap-flag-note">Not applied. Reopen the flag to apply it.</p>
              ) : anchor !== "found" ? (
                <p className="cap-flag-note">Cannot be applied: the passage it replaces has changed or gone.</p>
              ) : owner ? (
                <>
                  <button type="button" className="cap-btn" data-size="sm" data-variant="primary" data-cap-part="apply" onClick={onApply}>
                    Apply<span className="cap-sr-only"> suggestion: {flag.message}</span>
                  </button>
                  <span className="cap-flag-note">Nothing changes in the draft until you apply it.</span>
                </>
              ) : (
                <p className="cap-flag-note">Only the owner{ownerName ? `, ${ownerName},` : ""} can apply this. The draft stays as it is until they do.</p>
              )}
            </div>
          </div>
        ) : null}
        {!open ? (
          <p className="cap-flag-resolution">
            {WORDS[r]}
            {flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}
            {flag.resolvedAt ? (
              <>
                {" "}
                <Time at={flag.resolvedAt} now={now} />
              </>
            ) : null}
            .
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function FlagList({ label, flags: given, onFlagsChange, text, onTextChange, owner = false, ownerName, viewer, say = plainSay, fail = plainFail, filter: initial = "open", primary = false }: FlagListProps) {
  const uid = useId();
  const [flags, setFlags] = useState(given);
  useEffect(() => setFlags(given), [given]);
  const [filter, setFilter] = useState<FilterValue>(initial);
  const live = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const rows = useRef<HTMLUListElement>(null);
  // j and k, as the row list wires them.
  useEffect(() => (rows.current ? attachRowList(rows.current) : undefined), []);

  const counts = countFlags(flags);
  const groups = useMemo(() => groupFlags(flags), [flags]);
  // A closed flag is a record: it keeps what it said when it was closed.
  const status = (f: FlagData) => anchorStatus(f, f.state === "resolved" ? undefined : text);
  const waiting = appliable(flags, text);
  const batchApplicable = owner && text !== undefined && onTextChange !== undefined;

  const announce = (words: string, opts?: SayOptions) => {
    if (document.querySelector("[data-cap='message']")) say(words, opts);
    else if (live.current) {
      live.current.textContent = "";
      requestAnimationFrame(() => {
        if (live.current) live.current.textContent = words;
      });
    }
  };
  const problem = (words: string) => (document.querySelector("[data-cap='message']") ? fail(words) : announce(words));

  const commit = (next: FlagData[]) => {
    setFlags(next);
    onFlagsChange?.(next);
  };
  const patch = (list: FlagData[], id: string, to: Partial<FlagData>): FlagData[] => list.map((f) => (f.id === id ? { ...f, ...to } : f));
  const close = (f: FlagData, resolution: Resolution): Partial<FlagData> => ({ state: "resolved", resolution, resolvedBy: viewer, resolvedAt: new Date().toISOString() });
  const reopened: Partial<FlagData> = { state: "open", resolution: undefined, resolvedBy: undefined, resolvedAt: undefined };

  // The list as it will be, held in a ref, so an Undo that runs later acts on the current one.
  const latest = useRef(flags);
  latest.current = flags;
  const set = (next: FlagData[]) => {
    latest.current = next;
    commit(next);
  };

  const focusFlag = (id: string) => () => root.current?.querySelector<HTMLElement>(`[data-flag='${CSS.escape(id)}'] .cap-row-actions button`) ?? null;

  const change = (f: FlagData, to: Partial<FlagData>, said: string, undone: string) => {
    const before = f;
    set(patch(latest.current, f.id, to));
    announce(said, { undo: () => set(patch(latest.current, f.id, { state: before.state, resolution: before.resolution, resolvedBy: before.resolvedBy, resolvedAt: before.resolvedAt })), undone, returnFocus: focusFlag(f.id) });
  };

  const applyOne = (f: FlagData) => {
    if (!batchApplicable || text === undefined) return;
    const next = applySuggestion(text, f);
    if (next === null) return problem("Could not apply the suggestion: the passage it replaces has changed.");
    onTextChange?.(next);
    const current = next;
    const before = f;
    set(patch(latest.current, f.id, close(f, "applied")));
    announce("Suggestion applied to the draft.", {
      undo: () => {
        const back = revertSuggestion(current, f);
        if (back === null) throw new Error("The draft has changed around that passage since. Undo the edit in the editor instead.");
        onTextChange?.(back);
        set(patch(latest.current, f.id, { state: before.state, resolution: before.resolution, resolvedBy: before.resolvedBy, resolvedAt: before.resolvedAt }));
      },
      undone: "Suggestion taken back. The passage is as it was.",
      returnFocus: focusFlag(f.id),
    });
  };

  const applyAll = async () => {
    if (!batchApplicable || text === undefined) return;
    const todo = appliable(latest.current, text);
    if (todo.length === 0) return;
    const quoted = (s: string) => `“${s}”`;
    const n = todo.length;
    await confirm({
      title: `Apply ${n} suggestion${n === 1 ? "" : "s"}?`,
      lead: "This rewrites the draft. Each replacement is listed; nothing else changes.",
      body: todo.map((f) => `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`),
      action: `Apply ${n} suggestion${n === 1 ? "" : "s"}`,
      perform: async () => {
        let next = text;
        const done: FlagData[] = [];
        for (const f of todo) {
          const out = applySuggestion(next, f);
          if (out !== null) {
            next = out;
            done.push(f);
          }
        }
        if (done.length === 0) throw new Error("None of the passages could be found any more.");
        onTextChange?.(next);
        let list = latest.current;
        for (const f of done) list = patch(list, f.id, close(f, "applied"));
        set(list);
        const skipped = todo.length - done.length;
        announce(`Applied ${done.length} suggestion${done.length === 1 ? "" : "s"} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`, {
          undo: () => {
            let back = next;
            for (const f of [...done].reverse()) {
              const out = revertSuggestion(back, f);
              if (out === null) throw new Error("The draft has changed around those passages since. Undo the edits in the editor instead.");
              back = out;
            }
            onTextChange?.(back);
            let again = latest.current;
            for (const f of done) again = patch(again, f.id, reopened);
            set(again);
          },
          undone: "Suggestions taken back. The passages are as they were.",
        });
      },
    });
  };

  const group = (kind: FlagKind, name: string, list: FlagData[]) => {
    if (list.length === 0) return null;
    const open = list.filter((f) => f.state === "open").length;
    const hid = `${uid}-g-${kind}`;
    return (
      <li className="cap-flag-group" data-group={kind} key={kind}>
        <div className="cap-flag-group-head">
          <h3 className="cap-flag-group-title" id={hid}>
            {name}
          </h3>
          <span className="cap-flag-group-count">
            {open} open, {list.length - open} resolved
          </span>
        </div>
        <ul className="cap-flag-group-rows" role="list" aria-labelledby={hid}>
          {list.map((f) => (
            <Flag
              key={f.id}
              flag={f}
              anchor={status(f)}
              owner={batchApplicable}
              ownerName={ownerName}
              idPrefix={uid}
              onResolve={() => change(f, close(f, "resolved"), "Flag resolved.", "Flag reopened.")}
              onDismiss={() => change(f, close(f, "dismissed"), "Flag dismissed.", "Flag reopened.")}
              onReopen={() => change(f, reopened, "Flag reopened.", "Flag closed again.")}
              onApply={() => applyOne(f)}
            />
          ))}
        </ul>
      </li>
    );
  };

  const headingId = `${uid}-h`;
  const radio = (v: FilterValue, word: string, n: number) => (
    <label>
      <input type="radio" name={`${uid}-filter`} value={v} checked={filter === v} onChange={() => setFilter(v)} /> {word}
      <span className="cap-flags-count" data-count={v}>
        {n}
      </span>
    </label>
  );
  const n = waiting.length;
  return (
    <section ref={root} className="cap-flags" aria-labelledby={headingId} data-owner={owner ? "" : undefined} data-owner-name={ownerName} data-viewer={viewer}>
      <header className="cap-flags-head">
        <h2 className="cap-flags-title" id={headingId}>
          {label}
        </h2>
        <p className="cap-flags-summary" data-cap-part="summary">
          {summaryLine(counts)}
        </p>
        <fieldset className="cap-seg cap-flags-filter" data-cap-part="filter">
          <legend className="cap-sr-only">Show</legend>
          <div className="cap-seg-options" data-size="sm">
            {radio("open", "Open", counts.open)}
            {radio("resolved", "Resolved", counts.resolved)}
            {radio("all", "All", counts.total)}
          </div>
        </fieldset>
        <div className="cap-flags-batch">
          <button type="button" className="cap-btn" data-variant="primary" data-cap-part="apply-all" hidden={!batchApplicable || n === 0} onClick={() => void applyAll()}>
            Apply {n} suggestion{n === 1 ? "" : "s"}
          </button>
          <p className="cap-flags-note" data-cap-part="owner-note" hidden={owner || n === 0}>
            {n} suggestion{n === 1 ? " is" : "s are"} waiting for the owner{ownerName ? `, ${ownerName}` : ""}. Only they can apply them.
          </p>
        </div>
      </header>
      <ul ref={rows} className="cap-rows cap-flags-list" data-cap="row-list" role="list" aria-labelledby={headingId} data-cap-primary={primary ? "" : undefined}>
        {group("blocking", "Blocking", groups.blocking)}
        {group("advisory", "Advisory", groups.advisory)}
        <li className="cap-flags-empty" data-for="open">
          No open flags.
        </li>
        <li className="cap-flags-empty" data-for="resolved">
          Nothing resolved yet.
        </li>
        <li className="cap-flags-empty" data-for="all">
          No flags on this draft.
        </li>
      </ul>
      <div className="cap-sr-only" role="status" ref={live} />
    </section>
  );
}
