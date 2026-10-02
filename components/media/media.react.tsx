import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { Glyph } from "../status/status.react.tsx";
import { copySnippets, copyText, createAutosave, flagsFor, bands, byteSize, describeRecord, nextTile, parseTags, suggestedAlt, type Autosave, type Direction, type MediaFields, type MediaRecord, type SaveState } from "./media.ts";

export type { MediaFields, MediaRecord } from "./media.ts";

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
  onRestore?: (key: string) => void;
}

function slug(key: string): string {
  return key.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

export function MediaTile({ item, active, selected, inspecting, tabStop = true, href, onOpen, onSelect, onRetry, onRestore }: MediaTileProps) {
  const id = `tile-${slug(item.key)}`;
  const flags = flagsFor(item);
  const selectable = item.state === "ready" || item.state === "binned";
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
        {item.state === "binned" ? (
          <button type="button" className="cap-btn" data-size="xs" data-cap-part="restore" tabIndex={tab} onClick={() => onRestore?.(item.key)}>
            Restore<span className="cap-sr-only"> {item.name}</span>
          </button>
        ) : null}
      </span>
      {selectable ? (
        <label className="cap-media-check">
          <input type="checkbox" value={item.key} data-cap-select="" aria-label={`Select ${item.name}`} checked={!!selected} tabIndex={tab} onChange={() => onSelect?.(item.key, "toggle")} />
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
}

export function MediaGrid({ items, groups, activeKey, onActiveChange, selected, onSelectedChange, onOpen, inspecting, onRetry, onRestore, label = "Files" }: MediaGridProps) {
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

// ---------------------------------------------------------------------------------------
// MediaInspector: the details of one file, in a pane beside the grid or a side sheet over it, saving
// by itself. A failed save keeps what was typed, in the form and in `drafts`, so switching files
// and coming back does not lose it.

const drafts = new Map<string, MediaFields>();

export type MediaMode = "pane" | "sheet";

// Reads how the inspector sits ("pane" or "sheet") from the layout's container query, and follows
// it as the container resizes. Put the ref on the element with class cap-media-layout.
export function useMediaMode(layout: { current: HTMLElement | null }): MediaMode {
  const [mode, setMode] = useState<MediaMode>("pane");
  useLayoutEffect(() => {
    const el = layout.current;
    if (!el) return;
    const read = () => setMode(getComputedStyle(el).getPropertyValue("--cap-media-mode").trim() === "pane" ? "pane" : "sheet");
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);
  return mode;
}

export interface MediaInspectorProps {
  // The file, or null for none.
  item: MediaRecord | null;
  open: boolean;
  mode: MediaMode;
  // Sends the fields. Reject with an Error that says why; the pane shows it and Retry.
  onSave: (key: string, fields: MediaFields) => Promise<void>;
  onClose: () => void;
  onBin?: (key: string) => void;
  onRestore?: (key: string) => void;
  // The grid's Unattached filter, from the "Show unattached files" button.
  onShowUnattached?: () => void;
  // The tile that opened a sheet: focus returns here.
  opener?: HTMLElement | null;
  // Alt and an arrow in a field: the previous or next file. The app moves its active key.
  onStep?: (dir: "prev" | "next") => void;
  id?: string;
  // focus() puts focus in the first field: call it when the person asked to open the inspector (Enter on a tile).
  ref?: Ref<{ focus: () => void }>;
}

const SAVE_TEXT: Record<SaveState, string> = { idle: "Changes save by themselves.", dirty: "Unsaved changes", saving: "Saving…", saved: "Saved", failed: "Could not save" };

export function MediaInspector(props: MediaInspectorProps) {
  const { item, open, mode, onClose, opener, id, ref: handle } = props;
  const own = useId();
  const base = id ?? own;
  const ref = useRef<HTMLDialogElement>(null);
  const unwire = useRef<(() => void) | null>(null);
  const first = useRef<HTMLElement | null>(null);
  useImperativeHandle(handle, () => ({ focus: () => first.current?.focus() }), []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const modal = d.matches(":modal");
    if (open && item && mode === "pane") {
      if (modal) d.close();
      if (!d.open) d.show();
    } else if (open && item && mode === "sheet") {
      if (!modal) {
        if (d.open) d.close();
        unwire.current?.();
        unwire.current = wireDialog(d, { returnTo: opener ?? null });
        openDialog(d, opener ?? document.activeElement, { focus: first.current });
      }
    } else if (d.open) d.close();
  }, [open, item, mode, opener]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCloseEvent = () => {
      unwire.current?.();
      unwire.current = null;
      if (open) onClose();
    };
    d.addEventListener("close", onCloseEvent);
    return () => d.removeEventListener("close", onCloseEvent);
  }, [open, onClose]);

  const titleId = `${base}-title`;
  return (
    <dialog ref={ref} className="cap-dialog cap-media-inspector" data-cap="media-inspector" data-placement="right" data-size="md" id={base} aria-labelledby={titleId} open={open && mode === "pane" && !!item}>
      {item ? <InspectorBody key={item.key} {...props} item={item} base={base} titleId={titleId} firstRef={first} /> : <p className="cap-dialog-body">Select a file to see its details.</p>}
    </dialog>
  );
}

function InspectorBody({ item, onSave, onClose, onBin, onRestore, onShowUnattached, onStep, base, titleId, firstRef }: MediaInspectorProps & { item: MediaRecord; base: string; titleId: string; firstRef: { current: HTMLElement | null } }) {
  const draft = drafts.get(item.key);
  const initial: MediaFields = draft ?? { alt: item.alt, decorative: item.altState === "decorative", title: item.title, caption: item.caption, tags: item.tags };
  const [fields, setFields] = useState<MediaFields>(initial);
  const [tagText, setTagText] = useState("");
  const [state, setState] = useState<SaveState>(draft ? "failed" : "idle");
  const [error, setError] = useState<string | undefined>(draft ? "the last save did not go through" : undefined);
  const [copied, setCopied] = useState<ReactNode>(null);
  const latest = useRef(fields);
  latest.current = fields;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const saver = useRef<Autosave | null>(null);
  if (!saver.current) {
    saver.current = createAutosave({
      save: () => {
        const f = latest.current;
        const clean: MediaFields = { alt: f.decorative ? "" : f.alt.trim(), decorative: f.decorative, title: f.title.trim(), caption: f.caption.trim(), tags: f.tags };
        return onSaveRef.current(item.key, clean).then(
          () => void drafts.delete(item.key),
          (err: unknown) => {
            drafts.set(item.key, f);
            throw err;
          },
        );
      },
      onState: (s, e) => {
        setState(s);
        setError(e);
      },
    });
  }
  // Leaving this file saves what is unsaved first.
  useEffect(
    () => () => {
      void saver.current?.flush();
    },
    [],
  );
  const edit = (patch: Partial<MediaFields>, now = false) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setFields(next);
    saver.current?.schedule();
    if (now) void saver.current?.flush();
  };

  const img = item.kind === "image";
  const url = item.url;
  const snippets = copySnippets({ url, kind: item.kind, alt: fields.alt, name: item.name });
  const copy = async (value: string, what: string) => {
    setCopied(null);
    const ok = await copyText(value);
    setCopied(
      ok ? (
        <>
          <Glyph name="ok" />
          Copied the {what}.
        </>
      ) : (
        <>
          <Glyph name="crit" />
          Could not copy. The address is selected: press Ctrl+C or Cmd+C.
        </>
      ),
    );
    window.setTimeout(() => setCopied(null), ok ? 2500 : 8000);
  };
  const sub = [item.type.split("/").pop()?.toUpperCase(), byteSize(item.bytes), item.width && item.height ? `${item.width} by ${item.height}` : ""].filter(Boolean).join(" · ");
  const addTag = (text: string) => {
    const add = parseTags(text);
    if (add.length) edit({ tags: [...fields.tags, ...add.filter((t) => !fields.tags.includes(t))] }, true);
    setTagText("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowDown")) {
      e.preventDefault();
      void saver.current?.flush();
      onStep?.(e.key === "ArrowLeft" || e.key === "ArrowUp" ? "prev" : "next");
    }
  };
  const binned = item.state === "binned";

  return (
    <>
      <div className="cap-dialog-header" data-divider>
        <h2 className="cap-dialog-title cap-media-title" id={titleId} data-cap-part="title">
          {item.name}
        </h2>
        <p className="cap-dialog-description" data-cap-part="subtitle">{sub}</p>
      </div>
      <form
        className="cap-dialog-body cap-media-form"
        method="post"
        data-cap-part="form"
        aria-busy={state === "saving" ? true : undefined}
        onKeyDown={onKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          void saver.current?.flush();
        }}
        onBlur={(e) => {
          const t = e.target as HTMLElement;
          if (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input") void saver.current?.flush();
        }}
      >
        <input type="hidden" name="key" value={item.key} data-cap-part="key" />
        <div className="cap-media-preview">
          {img && item.thumb ? <img data-cap-part="preview" src={item.thumb} alt="" width={640} height={427} /> : <span className="cap-media-doc" aria-hidden="true">{(item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase()}</span>}
        </div>
        {img ? (
          <>
            <div className="cap-field" data-cap-part="alt-field">
              <label className="cap-field-label" htmlFor={`${base}-alt`}>
                Alt text
              </label>
              <textarea
                ref={(el) => {
                  if (el && !el.disabled) firstRef.current = el;
                }}
                className="cap-input"
                id={`${base}-alt`}
                name="alt"
                data-cap-part="alt"
                rows={2}
                placeholder="Describe what the picture shows"
                aria-describedby={`${base}-alt-help`}
                disabled={fields.decorative}
                value={fields.decorative ? "" : fields.alt}
                onChange={(e) => edit({ alt: e.target.value })}
              />
              <p className="cap-field-help" id={`${base}-alt-help`}>
                What a person who cannot see the picture needs to know. Leave out “image of”. {fields.alt.trim() ? "" : `Suggested: ${suggestedAlt(item.name)}.`}
              </p>
            </div>
            <div className="cap-field" data-cap-part="decorative-field">
              <label className="cap-check">
                <input type="checkbox" name="decorative" data-cap-part="decorative" aria-describedby={`${base}-deco-help`} checked={fields.decorative} onChange={(e) => edit({ decorative: e.target.checked, alt: e.target.checked ? "" : fields.alt }, true)} /> Decorative image
              </label>
              <p className="cap-field-help" id={`${base}-deco-help`}>
                It adds nothing a reader needs, so a screen reader skips it. This is a choice, not a missing description.
              </p>
            </div>
          </>
        ) : (
          <p className="cap-field-help" data-cap-part="alt-document">A document takes no alt text. What a reader hears is the link text, and that lives in the post.</p>
        )}
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${base}-title-field`}>
            Title
          </label>
          <input className="cap-input" id={`${base}-title-field`} data-cap-part="title-field" name="title" type="text" autoComplete="off" value={fields.title} onChange={(e) => edit({ title: e.target.value })} />
        </div>
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${base}-caption`}>
            Caption
          </label>
          <textarea className="cap-input" id={`${base}-caption`} data-cap-part="caption" name="caption" rows={2} value={fields.caption} onChange={(e) => edit({ caption: e.target.value })} />
        </div>
        <div className="cap-media-section" role="group" aria-labelledby={`${base}-tags-l`}>
          <span className="cap-field-label" id={`${base}-tags-l`}>
            Tags
          </span>
          <ul className="cap-media-tags" data-cap-part="tags">
            {fields.tags.map((t) => (
              <li key={t}>
                <button type="button" className="cap-chip" aria-label={`Remove tag ${t}`} onClick={() => edit({ tags: fields.tags.filter((x) => x !== t) }, true)}>
                  {t} <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
          <input type="hidden" name="tags" value={fields.tags.join(", ")} data-cap-part="tags-value" />
          <label className="cap-sr-only" htmlFor={`${base}-tag-input`}>
            Add a tag
          </label>
          <input
            className="cap-input"
            id={`${base}-tag-input`}
            type="text"
            autoComplete="off"
            placeholder="Add a tag, then press Enter"
            data-cap-part="tag-input"
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagText);
              }
            }}
            onBlur={() => tagText.trim() && addTag(tagText)}
          />
          <ul className="cap-media-tags" data-cap-part="suggestions">
            {(item.suggestedTags ?? [])
              .filter((t) => !fields.tags.includes(t))
              .map((t) => (
                <li key={t}>
                  <button type="button" className="cap-chip" aria-label={`Add suggested tag ${t}`} onClick={() => edit({ tags: [...fields.tags, t] }, true)}>
                    + {t}
                  </button>
                </li>
              ))}
          </ul>
        </div>
        <div className="cap-media-section" role="group" aria-labelledby={`${base}-addr-l`}>
          <label className="cap-field-label" id={`${base}-addr-l`} htmlFor={`${base}-addr`}>
            Address
          </label>
          <input className="cap-input" id={`${base}-addr`} data-cap-part="address" readOnly value={url} />
          <div className="cap-media-copy">
            {snippets.map((s) => (
              <button key={s.id} type="button" className="cap-btn" data-size="sm" data-cap-copy-kind={s.id} aria-label={s.name} onClick={() => void copy(s.value, s.name.replace(/^Copy (the )?/, ""))}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="cap-media-copied" role="status" data-cap-part="copied">
            {copied}
          </p>
        </div>
        <dl className="cap-media-facts" data-cap-part="facts">
          <dt>Key</dt>
          <dd>{item.key}</dd>
          <dt>Type</dt>
          <dd>{item.type || "unknown"}</dd>
          <dt>Size</dt>
          <dd>{byteSize(item.bytes)}</dd>
          <dt>Dimensions</dt>
          <dd>{item.width && item.height ? `${item.width} by ${item.height}` : "not measured"}</dd>
          <dt>Uploaded</dt>
          <dd>{item.uploaded ?? "ships with the site"}</dd>
        </dl>
        <section className="cap-media-section" aria-labelledby={`${base}-used-l`}>
          <h3 id={`${base}-used-l`}>Used in</h3>
          <div data-cap-part="used">
            {item.used.length > 0 ? (
              <ul className="cap-media-used">
                {item.used.map((u) => (
                  <li key={u.href}>
                    <a href={u.href}>{u.title}</a>
                    {u.how ? <span className="cap-media-used-how">{u.how}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="cap-media-used-empty">Not used anywhere.</p>
                <p className="cap-media-note">
                  No post cites this file. That is not proof it is unused: a page built in code can still use it, so check before you delete it. The Unattached filter lists every file like this.{" "}
                  {onShowUnattached ? (
                    <button type="button" className="cap-btn" data-variant="link" onClick={onShowUnattached}>
                      Show unattached files
                    </button>
                  ) : null}
                </p>
              </>
            )}
          </div>
        </section>
      </form>
      <div className="cap-dialog-footer">
        <div className="cap-media-save" data-cap-part="save" data-state={state}>
          <p role="status" data-cap-part="save-status">
            {state !== "failed" ? (
              <>
                {state === "saving" ? <Glyph name="running" /> : state === "saved" ? <Glyph name="ok" /> : state === "dirty" ? <Glyph name="info" /> : null}
                {SAVE_TEXT[state]}
              </>
            ) : null}
          </p>
          <p role="alert" data-cap-part="save-error">
            {state === "failed" ? (
              <>
                <Glyph name="crit" />
                Could not save{error ? `: ${error.replace(/\.$/, "")}` : ""}. What you typed is still here.
              </>
            ) : null}
          </p>
          <button type="button" className="cap-btn" data-size="sm" data-cap-part="retry-save" hidden={state !== "failed"} onClick={() => void saver.current?.retry()}>
            Retry
          </button>
        </div>
        {binned ? (
          <button type="button" className="cap-btn" data-cap-part="restore" onClick={() => onRestore?.(item.key)}>
            Restore
          </button>
        ) : (
          <button type="button" className="cap-btn" data-cap-part="bin" onClick={() => onBin?.(item.key)}>
            Move to the bin
          </button>
        )}
      </div>
      <button type="button" className="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close" onClick={onClose}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
