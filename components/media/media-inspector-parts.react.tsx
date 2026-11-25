import { useState, type ReactNode } from "react";
import { COPIED_MS, COPY_FAILED_MS, copyText } from "../copy/copy.ts";
import { formatBytes } from "../format/format.ts";
import { linkable } from "../hooks/hooks.ts";
import { Glyph } from "../status/status.react.tsx";
import { SAVE_TEXT, type MediaRecord, type SaveState } from "./media.ts";
import type { MediaInspectorProps } from "./media.react.tsx";

// The hidden fields every inspector form carries: what it is about and the version last seen.
export function Ident({ item, intent }: { item: MediaRecord; intent: string }) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="ids" value={item.key} />
      {item.version ? <input type="hidden" name="versions" value={item.version} /> : null}
    </>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// In form mode, a group of fields is its own form with its own Save button, posting `intent`, the
// file's id and its version; otherwise the fields sit in the inspector's one autosaving form.
export function Wrap({
  on,
  F,
  action,
  label,
  intent,
  item,
  save,
  children,
}: {
  on: boolean;
  F: NonNullable<MediaInspectorProps["Form"]>;
  action?: string;
  label: string;
  intent: string;
  item: MediaRecord;
  save: string;
  children: ReactNode;
}) {
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

// The file's address, read-only, with a button for each way to copy it (address, Markdown, HTML) and a
// live line that says what was copied.
export function AddressCopy({
  base,
  url,
  snippets,
}: {
  base: string;
  url: string;
  snippets: Array<{ id: string; name: string; label: string; value: string }>;
}) {
  const [copied, setCopied] = useState<ReactNode>(null);
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
  return (
    <div className="cap-media-section" role="group" aria-labelledby={`${base}-addr-l`}>
      <label className="cap-field-label" id={`${base}-addr-l`} htmlFor={`${base}-addr`}>
        Address
      </label>
      <input
        className="cap-input"
        id={`${base}-addr`}
        data-cap-part="address"
        readOnly
        value={url}
      />
      <div className="cap-media-copy">
        {snippets.map((s) => (
          <button
            key={s.id}
            type="button"
            className="cap-btn"
            data-size="sm"
            data-cap-copy-kind={s.id}
            aria-label={s.name}
            onClick={() => void copy(s.value, s.name.replace(/^Copy (the )?/, ""))}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="cap-media-copied" role="status" data-cap-part="copied">
        {copied}
      </p>
    </div>
  );
}

// The facts the system assigns, then where the file is used.
export function FactsUsed({
  item,
  base,
  onShowUnattached,
}: {
  item: MediaRecord;
  base: string;
  onShowUnattached?: () => void;
}) {
  return (
    <>
      <dl className="cap-media-facts" data-cap-part="facts">
        <dt>Key</dt>
        <dd>{item.key}</dd>
        <dt>Type</dt>
        <dd>{item.type || "unknown"}</dd>
        <dt>Size</dt>
        <dd>{formatBytes(item.bytes)}</dd>
        <dt>Dimensions</dt>
        <dd>{item.width && item.height ? `${item.width} by ${item.height}` : "not measured"}</dd>
        <dt>Uploaded</dt>
        <dd>{item.uploaded ?? "ships with the site"}</dd>
      </dl>
      <section className="cap-media-section" aria-labelledby={`${base}-used-l`}>
        <h3 id={`${base}-used-l`}>Used in</h3>
        <div data-cap-part="used">
          {item.usedUnknown ? (
            <p className="cap-media-note">
              Where it is used was not checked for this list. Open the file to see.
            </p>
          ) : item.used.length > 0 ? (
            <ul className="cap-media-used">
              {item.used.map((u) => (
                <li key={u.href}>
                  {linkable(u.href) ? <a href={u.href}>{u.title}</a> : u.title}
                  {u.how ? <span className="cap-media-used-how">{u.how}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="cap-media-used-empty">Not used anywhere.</p>
              <p className="cap-media-note">
                A page built in code can still use it: check before you delete it.{" "}
                {onShowUnattached ? (
                  <button
                    type="button"
                    className="cap-btn"
                    data-variant="link"
                    onClick={onShowUnattached}
                  >
                    Show unattached files
                  </button>
                ) : null}
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}

// The footer: the save status with Retry (autosave), then Move to Trash or Restore and Delete, then Close.
export function InspectorFooter({
  item,
  state,
  error,
  onRetry,
  formMode,
  F,
  action,
  can,
  onBin,
  onRestore,
  onClose,
  closeHref,
}: {
  item: MediaRecord;
  state: SaveState;
  error?: string;
  onRetry: () => void;
  formMode: boolean;
  F: NonNullable<MediaInspectorProps["Form"]>;
  action?: string;
  can: NonNullable<MediaInspectorProps["can"]>;
  onBin?: (key: string) => void;
  onRestore?: (key: string) => void;
  onClose: () => void;
  closeHref?: string;
}) {
  const binned = item.state === "binned";
  return (
    <>
      <div className="cap-dialog-footer">
        {formMode ? null : (
          <div className="cap-media-save" data-cap-part="save" data-state={state}>
            <p role="status" data-cap-part="save-status">
              {state !== "failed" ? (
                <>
                  {state === "saving" ? (
                    <Glyph name="running" />
                  ) : state === "saved" ? (
                    <Glyph name="ok" />
                  ) : state === "dirty" ? (
                    <Glyph name="info" />
                  ) : null}
                  {SAVE_TEXT[state]}
                </>
              ) : null}
            </p>
            <p role="alert" data-cap-part="save-error">
              {state === "failed" ? (
                <>
                  <Glyph name="crit" />
                  Could not save{error ? `: ${error.replace(/\.$/, "")}` : ""}. What you typed is
                  still here.
                </>
              ) : null}
            </p>
            <button
              type="button"
              className="cap-btn"
              data-size="sm"
              data-cap-part="retry-save"
              hidden={state !== "failed"}
              onClick={() => onRetry()}
            >
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
                <button
                  type="submit"
                  className="cap-btn"
                  data-variant="danger"
                  data-cap-part="delete"
                >
                  Delete for good
                </button>
              </F>
            ) : null}
          </>
        ) : binned ? (
          <button
            type="button"
            className="cap-btn"
            data-cap-part="restore"
            onClick={() => onRestore?.(item.key)}
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            className="cap-btn"
            data-cap-part="bin"
            onClick={() => onBin?.(item.key)}
          >
            Move to Trash
          </button>
        )}
      </div>
      {closeHref ? (
        <a
          className="cap-btn cap-dialog-close"
          data-variant="quiet"
          data-icon-only
          data-cap-part="close"
          aria-label="Close"
          href={closeHref}
          onClick={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <CloseGlyph />
        </a>
      ) : (
        <button
          type="button"
          className="cap-btn cap-dialog-close"
          data-variant="quiet"
          data-icon-only
          data-cap-part="close"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseGlyph />
        </button>
      )}
    </>
  );
}
