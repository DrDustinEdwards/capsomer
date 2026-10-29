// The media library's React grid: MediaTile and MediaGrid (media.react.tsx).

import { type KeyboardEvent, type ReactNode, useCallback, useId, useLayoutEffect, useRef } from "react";
import { Glyph } from "../status/status.react.tsx";
import { type Direction, type MediaRecord, bands, byteSize, describeRecord, flagsFor, nextTile } from "./media.ts";

// ---------------------------------------------------------------------------------------
// MediaTile: one file. Renders exactly the contract in the doc page: the open link (the tile's
// one tab stop), the flags, the checkbox, and the progress or failure block.

export interface MediaTileProps {
  item: MediaRecord;
  active?: boolean;
  selected?: boolean;
  // The inspector is open on the active tile: the link says aria-current.
  inspecting?: boolean;
  // Whether this tile's controls take Tab (roving: the active tile only).
  tabStop?: boolean;
  href?: string;
  onOpen?: (key: string) => void;
  onSelect?: (key: string, how: "toggle" | "range") => void;
  onRetry?: (key: string) => void;
  // A binned tile's Restore. Without it the tile has no Restore button (restore it from the
  // bulk bar or the inspector).
  onRestore?: (key: string) => void;
  // The checkbox as a form field: named `ids`, in this form (by id), so a form post carries
  // the ticked files with no script.
  selectForm?: string;
  // False for a list that only opens files (the picker): no checkbox.
  selectable?: boolean;
}

function slug(key: string): string {
  return key.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

export function MediaTile({ item, active, selected, inspecting, tabStop = true, href, onOpen, onSelect, onRetry, onRestore, selectForm, selectable: canSelect = true }: MediaTileProps) {
  const id = `tile-${slug(item.key)}`;
  const flags = flagsFor(item);
  const selectable = item.state === "ready" || item.state === "binned";
  const checkable = selectable && canSelect;
  const tab = tabStop ? 0 : -1;
  const kind = item.type.split("/").pop()?.toUpperCase() ?? "";
  const meta = item.state === "uploading" ? "Uploading" : item.state === "failed" ? "Not uploaded" : [kind, byteSize(item.bytes)].filter(Boolean).join(" · ");
  const body = (
    <>
      <span className="cap-media-thumb">
        {item.kind === "image" && item.thumb ? <img src={item.thumb} alt="" loading="lazy" decoding="async" width={320} height={320} /> : <span className="cap-media-doc" aria-hidden="true">{(item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase()}</span>}
      </span>
      <span className="cap-media-name" title={item.key}>
        {item.name}
      </span>
      <span className="cap-media-meta">{meta}</span>
    </>
  );
  const pct = Math.max(0, Math.min(100, Math.round(item.progress ?? 0)));
  return (
    <li
      className="cap-media-tile"
      id={id}
      data-key={item.key}
      data-label={item.name}
      data-state={item.state}
      data-kind={item.kind}
      data-type={item.type}
      data-bytes={item.bytes}
      data-width={item.width}
      data-height={item.height}
      data-uploaded={item.uploaded}
      data-url={item.url}
      data-alt={item.altState}
      data-alt-text={item.alt}
      data-title={item.title}
      data-caption={item.caption}
      data-tags={item.tags.join(", ")}
      data-used={item.used.length}
      data-used-in={JSON.stringify(item.used)}
      data-suggested-tags={JSON.stringify(item.suggestedTags ?? [])}
      data-progress={item.state === "uploading" ? pct : undefined}
      data-error={item.state === "failed" ? item.error : undefined}
      data-active={active ? "" : undefined}
      data-selected={selected ? "" : undefined}
    >
      {selectable ? (
        <a
          className="cap-media-open"
          href={href ?? `?key=${encodeURIComponent(item.key)}`}
          aria-describedby={`${id}-flags`}
          aria-current={inspecting && active ? "true" : undefined}
          tabIndex={tab}
          onClick={(e) => {
            e.preventDefault();
            if (e.shiftKey) onSelect?.(item.key, "range");
            else if (e.ctrlKey || e.metaKey) onSelect?.(item.key, "toggle");
            else onOpen?.(item.key);
          }}
        >
          {body}
        </a>
      ) : (
        <button type="button" className="cap-media-open" aria-disabled="true" aria-describedby={`${id}-flags`} aria-description={describeRecord(item)} tabIndex={tab}>
          {body}
        </button>
      )}
      <span className="cap-media-flags" id={`${id}-flags`}>
        {flags.map((f) => (
          <span key={f.word} className="cap-status" data-tone={f.tone}>
            <Glyph name={f.tone} />
            {f.word}
          </span>
        ))}
        {item.state === "binned" && onRestore ? (
          <button type="button" className="cap-btn" data-size="xs" data-cap-part="restore" tabIndex={tab} onClick={() => onRestore?.(item.key)}>
            Restore<span className="cap-sr-only"> {item.name}</span>
          </button>
        ) : null}
      </span>
      {checkable ? (
        <label className="cap-media-check">
          <input type="checkbox" name={selectForm ? "ids" : undefined} form={selectForm} value={item.key} data-cap-select="" aria-label={`Select ${item.name}`} checked={!!selected} tabIndex={tab} onChange={() => onSelect?.(item.key, "toggle")} />
          <span className="cap-media-check-box" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5l3 3 6-7" />
            </svg>
          </span>
          <span className="cap-media-check-word" aria-hidden="true">
            Selected
          </span>
        </label>
      ) : null}
      {/* The version this page saw, under the file's id: a form with no script cannot line a list of versions up
          with the boxes ticked, so the content kit reads each ticked id's own (site-api: version:<id>). */}
      {checkable && selectForm && item.version ? <input type="hidden" name={`version:${item.key}`} form={selectForm} value={item.version} /> : null}
      {item.state === "uploading" ? (
        <div className="cap-media-state">
          <div className="cap-meter" data-cap="meter">
            <span className="cap-meter-label" id={`${id}-p`}>
              Uploading
            </span>
            <span className="cap-meter-value">{pct}%</span>
            <ProgressBar labelId={`${id}-p`} pct={pct} name={item.name} />
          </div>
        </div>
      ) : null}
      {item.state === "failed" ? (
        <div className="cap-media-state" data-tone="crit">
          <p className="cap-media-state-lead">
            <Glyph name="crit" />
            Upload failed
          </p>
          <p className="cap-media-reason">{item.error ?? "The server did not say why."}</p>
          <button type="button" className="cap-btn" data-size="sm" data-cap-part="retry" tabIndex={tab} onClick={() => onRetry?.(item.key)}>
            Retry<span className="cap-sr-only"> uploading {item.name}</span>
          </button>
        </div>
      ) : null}
    </li>
  );
}

// The shared meter's bar, drawn as a progress bar: the fill's position is set through the CSSOM.
function ProgressBar({ labelId, pct, name }: { labelId: string; pct: number; name: string }) {
  const bar = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    bar.current?.style.setProperty("--cap-meter-ratio", String(pct / 100));
  }, [pct]);
  return (
    <span ref={bar} className="cap-meter-bar" role="progressbar" aria-labelledby={labelId} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct} percent of ${name} uploaded`}>
      <span className="cap-meter-fill" />
    </span>
  );
}

// ---------------------------------------------------------------------------------------
// MediaGrid: the tiles, with roving focus and the arrow keys. Selection and the active file are the
// app's state.

export interface MediaGroup {
  label: string;
  items: readonly MediaRecord[];
}

export interface MediaGridProps {
  // Either a flat list or groups under headings (a folder, a month).
  items?: readonly MediaRecord[];
  groups?: readonly MediaGroup[];
  activeKey: string;
  onActiveChange: (key: string) => void;
  selected: readonly string[];
  onSelectedChange: (keys: string[]) => void;
  // Enter, or a click: open the inspector on this file.
  onOpen: (key: string) => void;
  inspecting?: boolean;
  onRetry?: (key: string) => void;
  onRestore?: (key: string) => void;
  size?: "s" | "m" | "l";
  label?: string;
  // Where a tile's link goes with no script (its address); `?key=` by default.
  hrefFor?: (key: string) => string;
  // The tiles' checkboxes post as `ids` in this form (by id).
  selectForm?: string;
  // False: no checkboxes, Space and x do nothing (the picker opens a file and nothing else).
  selectable?: boolean;
}

export function MediaGrid({ items, groups, activeKey, onActiveChange, selected, onSelectedChange, onOpen, inspecting, onRetry, onRestore, label = "Files", hrefFor, selectForm, selectable = true }: MediaGridProps) {
  const root = useRef<HTMLDivElement>(null);
  const all = groups ? groups.flatMap((g) => g.items) : (items ?? []);
  const anchor = useRef<string>(activeKey);

  const toggle = (key: string) => onSelectedChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  const select = (key: string, how: "toggle" | "range") => {
    if (how === "range") {
      const keys = all.filter((i) => i.state === "ready" || i.state === "binned").map((i) => i.key);
      const a = keys.indexOf(anchor.current);
      const b = keys.indexOf(key);
      if (a >= 0 && b >= 0) {
        const span = keys.slice(Math.min(a, b), Math.max(a, b) + 1);
        onSelectedChange([...new Set([...selected, ...span])]);
        return;
      }
    }
    anchor.current = key;
    toggle(key);
  };

  const focusKey = useCallback(
    (key: string) => {
      onActiveChange(key);
      const link = root.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"] .cap-media-open`);
      link?.focus();
      link?.scrollIntoView({ block: "nearest" });
    },
    [onActiveChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement;
    const tile = t.closest<HTMLElement>(".cap-media-tile");
    if (!tile || !t.matches(".cap-media-open, .cap-media-check > input, .cap-btn")) return;
    const here = tile.dataset.key ?? "";
    const dirs: Record<string, Direction> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Home: "first", End: "last" };
    const dir = dirs[e.key];
    if (dir) {
      e.preventDefault();
      const boxes = Array.from(root.current?.querySelectorAll<HTMLElement>(".cap-media-tile") ?? []).map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.dataset.key ?? "", top: r.top, left: r.left, width: r.width };
      });
      const next = nextTile(bands(boxes), here, dir);
      if (next) focusKey(next);
    } else if (!selectable) {
      return;
    } else if (e.key === " " && !(t instanceof HTMLInputElement)) {
      e.preventDefault();
      select(here, "toggle");
    } else if ((e.key === "x" || e.key === "X") && !e.shiftKey && document.documentElement.dataset.capSingleKeys !== "off") {
      e.preventDefault();
      select(here, "toggle");
    }
  };

  const tiles = (list: readonly MediaRecord[]) =>
    list.map((item) => (
      <MediaTile
        key={item.key}
        item={item}
        active={item.key === activeKey}
        selected={selected.includes(item.key)}
        inspecting={inspecting}
        tabStop={item.key === activeKey}
        onOpen={(k) => {
          onActiveChange(k);
          onOpen(k);
        }}
        onSelect={select}
        onRetry={onRetry}
        onRestore={onRestore}
        href={hrefFor?.(item.key)}
        selectForm={selectForm}
        selectable={selectable}
      />
    ));

  return (
    <div ref={root} onKeyDown={onKeyDown} onFocus={(e) => {
        const k = (e.target as HTMLElement).closest<HTMLElement>(".cap-media-tile")?.dataset.key;
        if (k && k !== activeKey) onActiveChange(k);
      }}>
      {groups ? (
        groups.map((g) => (
          <GroupSection key={g.label} label={g.label} count={g.items.length} listLabel={`${label}, ${g.label}`}>
            {tiles(g.items)}
          </GroupSection>
        ))
      ) : (
        <ul className="cap-media-grid" role="list" aria-label={label}>
          {tiles(items ?? [])}
        </ul>
      )}
    </div>
  );
}

function GroupSection({ label, count, listLabel, children }: { label: string; count: number; listLabel: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="cap-media-group" aria-labelledby={id}>
      <h2 className="cap-media-group-title" id={id}>
        {label} <span className="cap-media-group-count">{count} on this page</span>
      </h2>
      <ul className="cap-media-grid" role="list" aria-label={listLabel}>
        {children}
      </ul>
    </section>
  );
}
