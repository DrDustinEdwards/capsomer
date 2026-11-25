import {
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import {
  type Autosave,
  type MediaFields,
  type MediaRecord,
  type SaveState,
  copySnippets,
  createAutosave,
} from "./media.ts";
import { formatBytes } from "../format/format.ts";
import { AddressCopy, FactsUsed, Ident, InspectorFooter } from "./media-inspector-parts.react.tsx";
import { InspectorFields } from "./media-inspector-fields.react.tsx";
import { PictureTools, nestedTool } from "./media-picture-tools.react.tsx";

export { MediaTile, MediaGrid } from "./media-grid.react.tsx";
export type { MediaTileProps, MediaGroup, MediaGridProps } from "./media-grid.react.tsx";

export type { MediaFields, MediaRecord } from "./media.ts";

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
    const read = () =>
      setMode(
        getComputedStyle(el).getPropertyValue("--cap-media-mode").trim() === "pane"
          ? "pane"
          : "sheet",
      );
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
  Form?: FormComponent;
  // Close as a link to this address (the list without ?inspect=), so it works with no script.
  closeHref?: string;
  // What the footer offers. Trash and Restore by default; Delete only when given.
  can?: { trash?: boolean; delete?: boolean };
  // The tools that change the picture itself, each offered only when given (site-api v0.10.0):
  // the focal point (a form posting `intent=focus` with `x` and `y` in percent), replace (a
  // multipart form posting `intent=replace` and `file`, with what it accepts in words), and crop
  // (needs script: the editor reads `src`, the file's bytes on the page's own origin, and hands the
  // crop to `onSave`). `keepsSize`: the site refuses a replacement of another size, so replace asks
  // for the same size and a crop is only ever a new file.
  tools?: {
    focus?: boolean;
    replace?: { accept: string; hint: string } | null;
    crop?: {
      src: string;
      asNew: boolean;
      inPlace: boolean;
      onSave: (file: File, how: "new" | "replace") => Promise<void>;
    } | null;
    keepsSize?: boolean;
  };
  // In autosave mode the tools sit inside the inspector's own form, so they cannot be forms: their
  // buttons hand the fields here instead (MediaLibrary posts them through `submit`).
  onTool?: (form: FormData) => void;
  // More sections after the picture tools, built by the host from `Tool` (a form in form mode, a
  // group that hands its fields to `onTool` inside the autosaving form) and `ident(intent)`, the
  // hidden fields every inspector form carries. MediaLibrary's credit, turns, history and suggestions.
  more?: (kit: {
    Tool: NonNullable<MediaInspectorProps["Form"]>;
    ident: (intent: string) => ReactNode;
    base: string;
  }) => ReactNode;
}

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
    <dialog
      ref={ref}
      className="cap-dialog cap-media-inspector"
      data-cap="media-inspector"
      data-placement="right"
      data-size="md"
      id={base}
      aria-labelledby={titleId}
      open={open && mode === "pane" && !!item}
    >
      {item ? (
        <InspectorBody
          key={item.key}
          {...props}
          item={item}
          base={base}
          titleId={titleId}
          firstRef={first}
        />
      ) : (
        <p className="cap-dialog-body">Select a file to see its details.</p>
      )}
    </dialog>
  );
}

function InspectorBody({
  item,
  onSave,
  onClose,
  onBin,
  onRestore,
  onShowUnattached,
  onStep,
  base,
  titleId,
  firstRef,
  show = {},
  saving = "auto",
  action,
  Form: F = PlainForm,
  closeHref,
  can = {},
  tools = {},
  onTool,
  more,
}: MediaInspectorProps & {
  item: MediaRecord;
  base: string;
  titleId: string;
  firstRef: { current: HTMLElement | null };
}) {
  const formMode = saving === "form" && !!action;
  const toolRef = useRef(onTool);
  useLayoutEffect(() => {
    toolRef.current = onTool;
  });
  // One component for the inspector's life, so a re-render never remounts a tool and loses its state.
  // oxlint-disable-next-line react/refs -- nestedTool keeps the ref and reads it only when the tool runs, never while rendering
  const [Nested] = useState(() => nestedTool(toolRef));
  const Tool = formMode ? F : Nested;
  const shows = {
    alt: show.alt ?? true,
    title: show.title ?? true,
    caption: show.caption ?? true,
    tags: show.tags ?? true,
  };
  const draft = drafts.get(item.key);
  const initial: MediaFields = draft ?? {
    alt: item.alt,
    decorative: item.altState === "decorative",
    title: item.title,
    caption: item.caption,
    tags: item.tags,
  };
  const [fields, setFields] = useState<MediaFields>(initial);
  const [state, setState] = useState<SaveState>(draft ? "failed" : "idle");
  const [error, setError] = useState<string | undefined>(
    draft ? "the last save did not go through" : undefined,
  );
  const latest = useRef(fields);
  useLayoutEffect(() => {
    latest.current = fields;
  });
  const onSaveRef = useRef(onSave);
  useLayoutEffect(() => {
    onSaveRef.current = onSave;
  });
  // One autosave for the inspector's life, made on the first render.
  // oxlint-disable-next-line react/refs -- the autosave keeps the refs and reads them only when it saves, never while rendering
  const [saver] = useState<Autosave>(() =>
    createAutosave({
      save: () => {
        const f = latest.current;
        const clean: MediaFields = {
          alt: f.decorative ? "" : f.alt.trim(),
          decorative: f.decorative,
          title: f.title.trim(),
          caption: f.caption.trim(),
          tags: f.tags,
        };
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
    }),
  );
  // Leaving this file saves what is unsaved first.
  useEffect(
    () => () => {
      void saver.flush();
    },
    [saver],
  );
  const edit = (patch: Partial<MediaFields>, now = false) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setFields(next);
    // In form mode each form's own Save button sends it.
    if (formMode) return;
    saver.schedule();
    if (now) void saver.flush();
  };

  const img = item.kind === "image";
  const url = item.url;
  const snippets = copySnippets({
    url,
    kind: item.kind,
    alt: fields.alt,
    decorative: fields.decorative,
    name: item.name,
  });
  const sub = [
    item.type.split("/").pop()?.toUpperCase(),
    formatBytes(item.bytes),
    item.width && item.height ? `${item.width} by ${item.height}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (
      e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      (e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowDown")
    ) {
      e.preventDefault();
      void saver.flush();
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
        <p className="cap-dialog-description" data-cap-part="subtitle">
          {sub}
        </p>
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
                void saver.flush();
              },
              onBlur: (e: { target: EventTarget }) => {
                const t = e.target as HTMLElement;
                if (/^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input")
                  void saver.flush();
              },
            })}
      >
        <input type="hidden" name="key" value={item.key} data-cap-part="key" />
        <div className="cap-media-preview">
          {img && item.thumb ? (
            <img data-cap-part="preview" src={item.thumb} alt="" width={640} height={427} />
          ) : (
            <span className="cap-media-doc" aria-hidden="true">
              {(item.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase()}
            </span>
          )}
        </div>
        <InspectorFields
          item={item}
          base={base}
          fields={fields}
          edit={edit}
          formMode={formMode}
          F={F}
          action={action}
          shows={shows}
          firstRef={firstRef}
        />
        {img && !binned && (tools.focus || tools.replace || tools.crop) && action ? (
          <PictureTools item={item} base={base} tools={tools} action={action} Tool={Tool} />
        ) : null}
        {more && action
          ? more({ Tool, ident: (intent) => <Ident item={item} intent={intent} />, base })
          : null}
        <AddressCopy base={base} url={url} snippets={snippets} />
        <FactsUsed item={item} base={base} onShowUnattached={onShowUnattached} />
      </BodyTag>
      <InspectorFooter
        item={item}
        state={state}
        error={error}
        onRetry={() => void saver.retry()}
        formMode={formMode}
        F={F}
        action={action}
        can={can}
        onBin={onBin}
        onRestore={onRestore}
        onClose={onClose}
        closeHref={closeHref}
      />
    </>
  );
}
