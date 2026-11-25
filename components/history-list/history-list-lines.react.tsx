import type { ReactNode } from "react";
import { Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { initials } from "../avatar/avatar.ts";
import { markup } from "../trusted-html/trusted-html.ts";
import {
  SIGN_GLYPH,
  deltaSign,
  deltaText,
  destinationGlyph,
  destinationTone,
  destinationWord,
  rangeText,
  runTitle,
  stamp,
  type HistoryEntry,
  type Run,
} from "./history-list.ts";

const Glyph = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg
    viewBox="0 0 16 16"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={markup(d)}
  />
);

function Who({ id, name, ai }: { id: string; name: string; ai?: boolean }) {
  return (
    <span className="cap-hist-who" id={id}>
      <span
        className="cap-avatar"
        data-size="sm"
        data-kind={ai ? "ai" : undefined}
        aria-hidden="true"
      >
        <span className="cap-avatar-fallback">
          {ai ? "AI" : initials(name.split(" and ")[0] ?? name)}
        </span>
      </span>
      <span className="cap-hist-name">
        <span>{name}</span>
      </span>
    </span>
  );
}

function Delta({ id, n }: { id: string; n: number | undefined }) {
  if (n === undefined)
    return <span className="cap-hist-delta" data-sign="none" aria-hidden="true" />;
  const sign = deltaSign(n);
  return (
    <span className="cap-hist-delta" id={id} data-sign={sign}>
      <Glyph d={SIGN_GLYPH[sign]} size={12} />
      <span>{deltaText(n)}</span>
    </span>
  );
}

function When({
  id,
  iso,
  now,
  chevron,
}: {
  id: string;
  iso: string;
  now?: number;
  chevron?: boolean;
}) {
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
  formId: string;
  now?: number;
  href: (id: string) => string;
  onPick: (id: string, el: HTMLInputElement) => void;
  onRestore: (e: HistoryEntry, opener: HTMLElement) => void;
  loadHref?: (id: string) => string;
  onLoad?: (e: HistoryEntry) => void;
  readOnly?: boolean;
}

export function Line({
  entry: e,
  delta,
  prefix,
  current,
  picked,
  pickDisabled,
  formId,
  now,
  href,
  onPick,
  onRestore,
  loadHref,
  onLoad,
  readOnly,
}: LineProps) {
  const p = `${prefix}-${e.id}`;
  const stampText = stamp(e.at, now);
  const hasDetail = e.kind !== "edit";
  const described = [hasDetail ? `${p}-d` : "", delta === undefined ? "" : `${p}-w`, `${p}-t`]
    .filter(Boolean)
    .join(" ");
  return (
    <li
      className="cap-row cap-hist-row"
      data-kind={e.kind}
      data-id={e.id}
      data-at={e.at}
      data-words={e.words}
      data-who={e.who}
      data-current={current ? "" : undefined}
    >
      <span className="cap-hist-pick">
        <label className="cap-check">
          <input
            type="checkbox"
            name="compare"
            value={e.id}
            form={formId}
            data-cap-part="pick"
            checked={picked}
            aria-disabled={pickDisabled ? "true" : undefined}
            onChange={(ev) => onPick(e.id, ev.currentTarget)}
            onClick={(ev) => pickDisabled && ev.preventDefault()}
          />
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
              <Status tone={destinationTone(d.status)} glyph={destinationGlyph(d.status)}>
                {destinationWord(d.status)}
              </Status>{" "}
              {d.name}{" "}
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
          <Status tone="ok">Current</Status>
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
            Load into editor
            <span className="cap-sr-only">
              {" "}
              the version from {stampText} by {e.who}
            </span>
          </a>
        ) : (
          <button
            type="button"
            className="cap-btn"
            data-variant="quiet"
            data-size="sm"
            data-cap-part="restore"
            data-version={e.id}
            onClick={(ev) => onRestore(e, ev.currentTarget)}
          >
            Restore
            <span className="cap-sr-only">
              {" "}
              the version from {stampText} by {e.who}
            </span>
          </button>
        )}
      </div>
    </li>
  );
}

export function RunLines({
  run,
  prefix,
  now,
  open,
  onToggle,
  children,
}: {
  run: Run;
  prefix: string;
  now?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const first = run.entries[0] as HistoryEntry;
  const p = `${prefix}-run-${first.id}`;
  const title = runTitle(run);
  const names =
    run.who.length > 1 ? `${run.who[0]} and ${run.who.length - 1} more` : (run.who[0] ?? "");
  return (
    <>
      <li className="cap-row cap-hist-row" data-kind="run">
        <span className="cap-hist-pick" />
        <Who id={`${p}-who`} name={names} />
        <div className="cap-row-title">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${p}-rows`}
            aria-describedby={`${p}-d ${p}-w ${p}-t`}
            onClick={onToggle}
          >
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
