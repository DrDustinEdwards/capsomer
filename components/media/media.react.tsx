import { type ComponentType, type FormHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { Glyph } from "../status/status.react.tsx";
import { type Autosave, type MediaFields, type MediaRecord, type SaveState, byteSize, copySnippets, copyText, createAutosave, parseTags, suggestedAlt } from "./media.ts";
import { COPIED_MS, COPY_FAILED_MS } from "./media-actions.ts";

export { MediaTile, MediaGrid } from "./media-grid.react.tsx";
export type { MediaTileProps, MediaGroup, MediaGridProps } from "./media-grid.react.tsx";

export type { MediaFields, MediaRecord } from "./media.ts";

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
  // Which fields it shows. All by default; a site that keeps no title or caption leaves them out.
  show?: { alt?: boolean; title?: boolean; caption?: boolean; tags?: boolean };
  // "auto" (the default) saves by itself through onSave. "form" is one form per field with its
  // own Save button, posting to `action`, so it works with no script.
  saving?: "auto" | "form";
  // Where its forms post: the fields in form mode, and Move to Trash, Restore and Delete in
  // either mode (each a form with `intent`, `ids` and `version`). Without it those are buttons.
  action?: string;
  // The host router's form component, for those forms.
  Form?: ComponentType<FormHTMLAttributes<HTMLFormElement> & { method?: "get" | "post" }>;
  // Close as a link to this address (the list without ?inspect=), so it works with no script.
  closeHref?: string;
  // What the footer offers. Trash and Restore by default; Delete only when given.
  can?: { trash?: boolean; delete?: boolean };
}

const PlainForm: NonNullable<MediaInspectorProps["Form"]> = (props) => <form {...props} />;

// The hidden fields every inspector form carries: what it is about and the version last seen.
function Ident({ item, intent }: { item: MediaRecord; intent: string }) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="ids" value={item.key} />
      {item.version ? <input type="hidden" name="version" value={item.version} /> : null}
    </>
  );
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

function InspectorBody({ item, onSave, onClose, onBin, onRestore, onShowUnattached, onStep, base, titleId, firstRef, show = {}, saving = "auto", action, Form: F = PlainForm, closeHref, can = {} }: MediaInspectorProps & { item: MediaRecord; base: string; titleId: string; firstRef: { current: HTMLElement | null } }) {
  const formMode = saving === "form" && !!action;
  const shows = { alt: show.alt ?? true, title: show.title ?? true, caption: show.caption ?? true, tags: show.tags ?? true };
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
    // In form mode each form's own Save button sends it.
    if (formMode) return;
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
    window.setTimeout(() => setCopied(null), ok ? COPIED_MS : COPY_FAILED_MS);
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
  // One autosaving form, or (form mode) a plain block holding one form per group of fields.
  const BodyTag = formMode ? "div" : "form";

  return (
    <>
      <div className="cap-dialog-header" data-divider>
        <h2 className="cap-dialog-title cap-media-title" id={titleId} data-cap-part="title">
          {item.name}
        </h2>
        <p className="cap-dialog-description" data-cap-part="subtitle">{sub}</p>
      </div>
      <BodyTag
        className="cap-dialog-body cap-media-form"
        data-cap-part="form"
        {...(formMode
          ? { onKeyDown }
          : {
              method: "post",
              "aria-busy": state === "saving" ? true : undefined,
              onKeyDown,
              onSubmit: (e: { preventDefault: () => void }) => {
                e.preventDefault();
                void saver.current?.flush();
              },
              onBlur: (e: { target: EventTarget }) => {
                const t = e.target as HTMLElement;
                if (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input") void saver.current?.flush();
              },
            })}
      >
        <input type="hidden" name="key" value={item.key} data-cap-part="key" />
        <div className="cap-media-preview">
          {img && item.thumb ? <img data-cap-part="preview" src={item.thumb} alt="" width={640} height={427} /> : <span className="cap-media-doc" aria-hidden="true">{(item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase()}</span>}
        </div>
        {img && shows.alt ? (
          <Wrap on={formMode} F={F} action={action} label="Alt text" intent="save-alt" item={item} save="Save alt text">
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
                disabled={fields.decorative && !formMode}
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
          </Wrap>
        ) : !img ? (
          <p className="cap-field-help" data-cap-part="alt-document">A document takes no alt text. What a reader hears is the link text, and that lives in the post.</p>
        ) : null}
        {shows.title || shows.caption ? (
          <Wrap on={formMode} F={F} action={action} label="Title and caption" intent="save-details" item={item} save="Save title and caption">
            {shows.title ? (
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-title-field`}>
                  Title
                </label>
                <input className="cap-input" id={`${base}-title-field`} data-cap-part="title-field" name="title" type="text" autoComplete="off" value={fields.title} onChange={(e) => edit({ title: e.target.value })} />
              </div>
            ) : null}
            {shows.caption ? (
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-caption`}>
                  Caption
                </label>
                <textarea className="cap-input" id={`${base}-caption`} data-cap-part="caption" name="caption" rows={2} value={fields.caption} onChange={(e) => edit({ caption: e.target.value })} />
              </div>
            ) : null}
          </Wrap>
        ) : null}
        {shows.tags && formMode ? (
          <Wrap on F={F} action={action} label="Tags" intent="save-tags" item={item} save="Save tags">
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${base}-tags-text`}>
                Tags
              </label>
              <input className="cap-input" id={`${base}-tags-text`} name="tags" type="text" autoComplete="off" aria-describedby={`${base}-tags-help`} value={fields.tags.join(", ")} onChange={(e) => edit({ tags: parseTags(e.target.value) })} />
              <p className="cap-field-help" id={`${base}-tags-help`}>
                Separate tags with commas.
              </p>
            </div>
          </Wrap>
        ) : null}
        {shows.tags && !formMode ? (
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
        ) : null}
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
            {item.usedUnknown ? (
              <p className="cap-media-note">Where it is used was not checked for this list. Open the file to see.</p>
            ) : item.used.length > 0 ? (
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
      </BodyTag>
      <div className="cap-dialog-footer">
        {formMode ? null : (
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
        )}
        {action ? (
          <>
            {binned ? (
              <F method="post" action={action} className="cap-media-act">
                <Ident item={item} intent="restore" />
                <button type="submit" className="cap-btn" data-cap-part="restore">
                  Restore
                </button>
              </F>
            ) : can.trash !== false ? (
              <F method="post" action={action} className="cap-media-act">
                <Ident item={item} intent="trash" />
                <button type="submit" className="cap-btn" data-cap-part="bin">
                  Move to Trash
                </button>
              </F>
            ) : null}
            {can.delete ? (
              <F method="post" action={action} className="cap-media-act">
                <Ident item={item} intent="delete" />
                <button type="submit" className="cap-btn" data-variant="danger" data-cap-part="delete">
                  Delete for good
                </button>
              </F>
            ) : null}
          </>
        ) : binned ? (
          <button type="button" className="cap-btn" data-cap-part="restore" onClick={() => onRestore?.(item.key)}>
            Restore
          </button>
        ) : (
          <button type="button" className="cap-btn" data-cap-part="bin" onClick={() => onBin?.(item.key)}>
            Move to Trash
          </button>
        )}
      </div>
      {closeHref ? (
        <a className="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close" href={closeHref} onClick={(e) => {
            e.preventDefault();
            onClose();
          }}>
          <CloseGlyph />
        </a>
      ) : (
        <button type="button" className="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close" onClick={onClose}>
          <CloseGlyph />
        </button>
      )}
    </>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// In form mode, a group of fields is its own form with its own Save button, posting `intent`, the
// file's id and its version; otherwise the fields sit in the inspector's one autosaving form.
function Wrap({ on, F, action, label, intent, item, save, children }: { on: boolean; F: NonNullable<MediaInspectorProps["Form"]>; action?: string; label: string; intent: string; item: MediaRecord; save: string; children: ReactNode }) {
  if (!on || !action) return <>{children}</>;
  return (
    <F method="post" action={action} className="cap-media-field-form" aria-label={label}>
      <Ident item={item} intent={intent} />
      {children}
      <button type="submit" className="cap-btn" data-size="sm">
        {save}
      </button>
    </F>
  );
}
