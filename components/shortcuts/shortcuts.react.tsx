import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { SINGLE_KEYS_NOTE, grouped, keyCaps, modifiedShortcutFor, register, setSheetOpener, setSingleKeys, singleKeysOn, type Shortcut } from "./shortcuts.ts";

// Registers a shortcut while the component is mounted. The latest `run` is always the one
// called, so passing a new function each render does not re-register.
export function useShortcut(key: string | string[], run: (e: KeyboardEvent) => void, opts: { label?: string; about?: string; group?: string; when?: () => boolean } = {}): void {
  const latest = useRef(run);
  latest.current = run;
  const when = useRef(opts.when);
  when.current = opts.when;
  const keyId = Array.isArray(key) ? key.join("|") : key;
  useEffect(() => {
    const s: Shortcut = {
      key,
      label: opts.label ?? keyId,
      about: opts.about,
      group: opts.group ?? "Other",
      run: (e) => latest.current(e),
      when: () => (when.current ? when.current() : true),
    };
    return register(s);
    // The key, label and group identify the registration; run and when are read live.
  }, [keyId, opts.label, opts.about, opts.group]);
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
  const dlg = useRef<HTMLDialogElement | null>(null);
  const closeButton = useRef<HTMLElement | null>(null);
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
    if (open) setGroups(grouped());
  }, [open]);

  // Focus starts on Close: the dialog's own Close button, found once the markup is there.
  const setRef = useCallback((el: HTMLDialogElement | null) => {
    dlg.current = el;
    closeButton.current = el?.querySelector<HTMLElement>("[data-cap-part='close']") ?? null;
  }, []);

  return (
    <Dialog
      ref={setRef}
      className="cap-keys"
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      size="md"
      initialFocus={closeButton}
      aria-labelledby={`${id}-title`}
      // A shortcut with Ctrl or Cmd still works over the sheet: the sheet closes, then it runs.
      onKeyDown={(e) => {
        const hit = modifiedShortcutFor(e.nativeEvent);
        if (!hit) return;
        e.preventDefault();
        dlg.current?.close();
        hit.run(e.nativeEvent);
      }}
    >
      <DialogHeader divider>
        <DialogTitle id={`${id}-title`}>Keyboard shortcuts</DialogTitle>
      </DialogHeader>
      <DialogBody className="cap-keys-body" data-cap-part="keys-list">
        {groups.map((g) => (
          <div className="cap-keys-group" key={g.group}>
            <h3 className="cap-keys-group-title">{g.group}</h3>
            <dl className="cap-keys-list">
              {g.items.map((s, i) => (
                <div key={`${s.label}-${i}`}>
                  <dt>
                    <Keys spec={s.key} />
                  </dt>
                  <dd>
                    {s.label}
                    {s.about ? <span className="cap-keys-about">{s.about}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </DialogBody>
      <DialogFooter align="start">
        <div className="cap-keys-foot">
          <label className="cap-switch">
            <input type="checkbox" role="switch" data-cap-part="single-keys" aria-describedby={`${id}-note`} checked={single} onChange={(e) => setSingleKeys(e.target.checked)} />
            <span>Single-key shortcuts</span>
            <span className="cap-switch-state" aria-hidden="true">
              {single ? "On" : "Off"}
            </span>
          </label>
          <p className="cap-keys-note" id={`${id}-note`}>
            {SINGLE_KEYS_NOTE}
          </p>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
