import { Fragment, useEffect, useId, useRef, useState } from "react";
import { isBackdropClick, rememberOpener, returnFocus } from "../confirm-dialog/confirm-dialog.ts";
import { grouped, keyCaps, register, setSheetOpener, setSingleKeys, singleKeysOn, type Shortcut } from "./shortcuts.ts";

// Registers a shortcut while the component is mounted. The latest `run` is always the one
// called, so passing a new function each render does not re-register.
export function useShortcut(key: string | string[], run: (e: KeyboardEvent) => void, opts: { label?: string; group?: string; when?: () => boolean } = {}): void {
  const latest = useRef(run);
  latest.current = run;
  const when = useRef(opts.when);
  when.current = opts.when;
  const keyId = Array.isArray(key) ? key.join("|") : key;
  useEffect(() => {
    const s: Shortcut = {
      key,
      label: opts.label ?? keyId,
      group: opts.group ?? "Other",
      run: (e) => latest.current(e),
      when: () => (when.current ? when.current() : true),
    };
    return register(s);
    // The key, label and group identify the registration; run and when are read live.
  }, [keyId, opts.label, opts.group]);
}

function Keys({ spec }: { spec: string | string[] }) {
  const specs = Array.isArray(spec) ? spec : [spec];
  return (
    <>
      {specs.map((s, i) => (
        <Fragment key={s}>
          {i > 0 ? " or " : null}
          {keyCaps(s).map((cap, j) => (
            <Fragment key={`${cap}-${j}`}>
              {j > 0 ? " " : null}
              <kbd>{cap}</kbd>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}

export interface ShortcutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The "?" sheet: every registered shortcut by group, and the switch for single keys. While
// mounted it is the sheet "?" opens.
export function ShortcutSheet({ open, onOpenChange }: ShortcutSheetProps) {
  const id = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [single, setSingle] = useState(true);
  const [groups, setGroups] = useState<ReturnType<typeof grouped>>([]);

  useEffect(() => {
    setSheetOpener(() => onOpenChange(true));
    return () => setSheetOpener(null);
  }, [onOpenChange]);

  useEffect(() => {
    const sync = () => setSingle(singleKeysOn());
    sync();
    document.addEventListener("cap-single-keys", sync);
    return () => document.removeEventListener("cap-single-keys", sync);
  }, []);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      setGroups(grouped());
      rememberOpener(d, document.activeElement);
      d.showModal();
      closeRef.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dlg}
      className="cap-keys"
      data-cap="shortcuts"
      aria-labelledby={`${id}-title`}
      onClose={() => {
        const d = dlg.current;
        if (d) returnFocus(d);
        onOpenChange(false);
      }}
      onClick={(e) => {
        const d = dlg.current;
        if (d && isBackdropClick(d, e.nativeEvent)) d.close();
      }}
    >
      <div className="cap-keys-head">
        <h2 className="cap-keys-title" id={`${id}-title`}>
          Keyboard shortcuts
        </h2>
        <button ref={closeRef} type="button" className="cap-btn" data-cap-part="close" onClick={() => dlg.current?.close()}>
          Close
        </button>
      </div>
      <div className="cap-keys-body" data-cap-part="keys-list">
        {groups.map((g) => (
          <div className="cap-keys-group" key={g.group}>
            <h3 className="cap-keys-group-title">{g.group}</h3>
            <dl className="cap-keys-list">
              {g.items.map((s, i) => (
                <div key={`${s.label}-${i}`}>
                  <dt>
                    <Keys spec={s.key} />
                  </dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="cap-keys-foot">
        <label className="cap-switch">
          <input
            type="checkbox"
            role="switch"
            data-cap-part="single-keys"
            aria-describedby={`${id}-note`}
            checked={single}
            onChange={(e) => setSingleKeys(e.target.checked)}
          />
          <span>Single-key shortcuts</span>
          <span className="cap-switch-state" aria-hidden="true">
            {single ? "On" : "Off"}
          </span>
        </label>
        <p className="cap-keys-note" id={`${id}-note`}>
          Turn these off if they clash with a screen reader or speech input. Shortcuts with Ctrl or ⌘ keep working.
        </p>
      </div>
    </dialog>
  );
}
