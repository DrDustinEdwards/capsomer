import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { CLEARS_AFTER_MS, isUndoKey, undoneText, type SayOptions } from "./message.ts";

export type { SayOptions };

interface Current {
  gen: number;
  text: string;
  undo: SayOptions["undo"] | null;
  undone?: string;
  clears: boolean;
  pending: boolean;
}

export interface MessageApi {
  // Says a message in the page's region. Does not move focus.
  say: (text: string, opts?: SayOptions) => void;
  dismiss: () => void;
}

interface Ctx extends MessageApi {
  current: Current | null;
  runUndo: () => void;
  undoRef: RefObject<HTMLButtonElement | null>;
  dismissRef: RefObject<HTMLButtonElement | null>;
  regionRef: RefObject<HTMLDivElement | null>;
}

const MessageContext = createContext<Ctx | null>(null);

export interface MessageProviderProps {
  children: ReactNode;
  // Renders the region after the children. Pass false and place <MessageRegion /> where
  // the page's results should show.
  region?: boolean;
  // `z` runs the current Undo. False when the app's single-key shortcuts are switched off.
  undoKey?: boolean;
}

export function MessageProvider({ children, region = true, undoKey = true }: MessageProviderProps) {
  const [current, setCurrent] = useState<Current | null>(null);
  const live = useRef<Current | null>(null);
  live.current = current;
  const gen = useRef(0);
  const origin = useRef<Element | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);
  const dismissRef = useRef<HTMLButtonElement | null>(null);
  // Focus that was on a button the next render removes goes to Dismiss, or back.
  const refocus = useRef(false);

  const focusInside = () => !!regionRef.current?.contains(document.activeElement);

  const say = useCallback((text: string, opts: SayOptions = {}) => {
    const active = document.activeElement;
    if (active && active !== document.body && !regionRef.current?.contains(active)) origin.current = active;
    if (regionRef.current?.contains(active)) refocus.current = true;
    gen.current += 1;
    setCurrent({ gen: gen.current, text, undo: opts.undo ?? null, undone: opts.undone, clears: !!opts.clears && !opts.undo, pending: false });
  }, []);

  const dismiss = useCallback(() => {
    if (focusInside()) refocus.current = true;
    gen.current += 1;
    setCurrent(null);
  }, []);

  const runUndo = useCallback(async () => {
    const now = live.current;
    if (!now?.undo || now.pending) return;
    const fn = now.undo;
    const hadFocus = focusInside();
    setCurrent({ ...now, pending: true });
    try {
      await fn();
    } catch {
      // Nothing was undone, so Undo stays available.
      if (gen.current === now.gen) setCurrent({ ...now, text: "Could not undo that. Try again.", pending: false });
      return;
    }
    // The Undo may have said something itself; if not, say what was undone.
    if (gen.current === now.gen) {
      if (hadFocus) refocus.current = true;
      gen.current += 1;
      setCurrent({ gen: gen.current, text: undoneText(now.text, now.undone), undo: null, clears: false, pending: false });
    }
  }, []);

  // After a render that removed the focused button, focus goes to Dismiss, else back to
  // the control that caused the message, else the main region.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    if (focusInside()) return;
    if (dismissRef.current) return dismissRef.current.focus();
    const back = origin.current instanceof HTMLElement && origin.current.isConnected ? origin.current : document.querySelector<HTMLElement>("main");
    back?.focus();
  }, [current]);

  // A plain confirmation clears itself after 4 seconds.
  useEffect(() => {
    if (!current?.clears) return;
    const t = window.setTimeout(() => {
      if (gen.current === current.gen) setCurrent(null);
    }, CLEARS_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [current]);

  // `z` runs the current Undo.
  const hasUndo = !!current?.undo;
  useEffect(() => {
    if (!undoKey || !hasUndo) return;
    const onKey = (e: KeyboardEvent) => {
      if (!isUndoKey(e)) return;
      e.preventDefault();
      void runUndo();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undoKey, hasUndo, runUndo]);

  const value = useMemo<Ctx>(() => ({ say, dismiss, current, runUndo, undoRef, dismissRef, regionRef }), [say, dismiss, current, runUndo]);
  return (
    <MessageContext.Provider value={value}>
      {children}
      {region ? <MessageRegion /> : null}
    </MessageContext.Provider>
  );
}

export function useMessage(): MessageApi {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessage needs a <MessageProvider> above it.");
  return { say: ctx.say, dismiss: ctx.dismiss };
}

// The region itself. One per page. It has no data-cap attribute, so the plain behaviour
// module never attaches to a region React owns.
export function MessageRegion() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("MessageRegion needs a <MessageProvider> above it.");
  const { current, runUndo, dismiss, undoRef, dismissRef, regionRef } = ctx;
  return (
    <div className="cap-message" role="status" ref={regionRef}>
      {/* A new key per message re-inserts the text, so the same words are announced again. */}
      <p className="cap-message-text" data-cap-part="text" key={current?.gen ?? 0}>
        {current?.text ?? ""}
      </p>
      {current?.undo ? (
        <button type="button" className="cap-link-btn cap-message-undo" data-cap-part="undo" aria-busy={current.pending || undefined} onClick={() => void runUndo()} ref={undoRef}>
          Undo <kbd aria-hidden="true">z</kbd>
        </button>
      ) : null}
      {current && !current.clears ? (
        <button type="button" className="cap-btn cap-message-dismiss" data-cap-part="dismiss" onClick={dismiss} ref={dismissRef}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
