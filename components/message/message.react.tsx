import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { CLEARS_AFTER_MS, GLYPHS, currentUndo, isUndoKey, kindOf, lasting, newMessage, resolveFocus, undoErrorText, undoneText, withMessage, type Message, type SayOptions } from "./message.ts";

export type { Message, SayOptions };

export interface MessageApi {
  // Says a message in the page's region. Does not move focus. A plain result replaces the
  // plain result before it; a warning, a failure and a failed Undo stay until dismissed.
  say: (text: string, opts?: SayOptions) => void;
  // Says that something did not happen and has no control beside it to say so (a failed
  // copy, a failed refresh). Stays until dismissed.
  fail: (text: string) => void;
  // Clears every message, lasting ones too.
  dismiss: () => void;
}

interface Settle {
  to?: HTMLElement | null;
  id?: number;
  origin?: boolean;
}

interface Ctx extends MessageApi {
  messages: Message[];
  runUndo: (id?: number) => void;
  dismissOne: (id: number) => void;
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
  const [messages, setMessages] = useState<Message[]>([]);
  // The truth between renders: an Undo that finishes later reads the list as it is then.
  const live = useRef<Message[]>([]);
  const nextId = useRef(1);
  const origin = useRef<Element | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef(new Map<number, number>());
  // Where focus goes after the render that removes the button that had it.
  const settle = useRef<Settle | null>(null);

  const commit: (next: Message[], s?: Settle) => void = useCallback((next: Message[], s?: Settle) => {
    if (s?.to || regionRef.current?.contains(document.activeElement)) settle.current = s ?? {};
    live.current = next;
    setMessages(next);
    const ids = new Set(next.map((m) => m.id));
    for (const [id, t] of timers.current) {
      if (!ids.has(id)) {
        window.clearTimeout(t);
        timers.current.delete(id);
      }
    }
    for (const m of next) {
      if (!m.clears || timers.current.has(m.id)) continue;
      const id = m.id;
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id);
          commit(
            live.current.filter((x) => x.id !== id),
            { origin: true },
          );
        }, CLEARS_AFTER_MS),
      );
    }
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => {
      for (const id of t.values()) window.clearTimeout(id);
      t.clear();
    };
  }, []);

  const say = useCallback(
    (text: string, opts: SayOptions = {}) => {
      const active = document.activeElement;
      if (active && active !== document.body && !regionRef.current?.contains(active)) origin.current = active;
      commit(withMessage(live.current, newMessage(nextId.current++, text, opts)));
    },
    [commit],
  );
  const fail = useCallback((text: string) => say(text, { failure: true }), [say]);
  const dismiss = useCallback(() => commit([], { origin: true }), [commit]);
  const dismissOne = useCallback(
    (id: number) => {
      if (live.current.find((m) => m.id === id)?.busy) return;
      commit(
        live.current.filter((m) => m.id !== id),
        { origin: true },
      );
    },
    [commit],
  );

  const runUndo = useCallback(
    async (id?: number) => {
      const m = id === undefined ? currentUndo(live.current) : live.current.find((x) => x.id === id);
      if (!m?.undo || m.busy) return;
      const run = m.undo;
      commit(live.current.map((x) => (x.id === m.id ? { ...x, busy: true, error: null } : x)));
      try {
        await run();
      } catch (err) {
        // Nothing was undone, so Undo stays available, and the message says why. It stays too.
        if (live.current.some((x) => x.id === m.id)) commit(live.current.map((x) => (x.id === m.id ? { ...x, busy: false, error: undoErrorText(err) } : x)));
        return;
      }
      const to = resolveFocus(m.returnFocus);
      // The Undo may have said something itself, which replaced this message.
      if (!live.current.some((x) => x.id === m.id)) return;
      const said = undoneText(m.text, m.undone);
      if (m.warning !== null) {
        // A result that carried a warning keeps it, without its Undo; the Undo's own result arrives beside it.
        const kept = live.current.map((x) => (x.id === m.id ? { ...x, undo: null, busy: false, error: null } : x));
        commit(withMessage(kept, newMessage(nextId.current++, said)), { to, id: m.id });
      } else {
        commit(
          live.current.map((x) => (x.id === m.id ? newMessage(m.id, said) : x)),
          { to, id: m.id },
        );
      }
    },
    [commit],
  );

  // After a render that removed the focused button, focus goes where the caller said, else
  // to that message's Dismiss, else back to the control that caused the message, else the
  // main region.
  useEffect(() => {
    const s = settle.current;
    if (!s) return;
    settle.current = null;
    if (s.to) return s.to.focus();
    const region = regionRef.current;
    if (region?.contains(document.activeElement)) return;
    const back = origin.current instanceof HTMLElement && origin.current.isConnected ? origin.current : null;
    if (s.origin) return (back ?? document.querySelector<HTMLElement>("main"))?.focus();
    const own = s.id === undefined ? null : region?.querySelector<HTMLElement>(`[data-id="${s.id}"] [data-cap-part="dismiss"]`);
    const any = own ?? region?.querySelector<HTMLElement>("[data-cap-part='dismiss']");
    if (any) return any.focus();
    (back ?? document.querySelector<HTMLElement>("main"))?.focus();
  }, [messages]);

  // `z` runs the current Undo.
  const hasUndo = !!currentUndo(messages);
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

  const value = useMemo<Ctx>(() => ({ say, fail, dismiss, messages, runUndo, dismissOne, regionRef }), [say, fail, dismiss, messages, runUndo, dismissOne]);
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
  return { say: ctx.say, fail: ctx.fail, dismiss: ctx.dismiss };
}

// The same API, or null when no <MessageProvider> is above: for a component that says its
// results in the page's region when there is one and works without it (a form that posts).
export function useOptionalMessage(): MessageApi | null {
  const ctx = useContext(MessageContext);
  return ctx ? { say: ctx.say, fail: ctx.fail, dismiss: ctx.dismiss } : null;
}

// The region itself. One per page. It has no data-cap attribute, so the plain behaviour
// module never attaches to a region React owns.
export function MessageRegion() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("MessageRegion needs a <MessageProvider> above it.");
  const { messages, runUndo, dismissOne, regionRef } = ctx;
  return (
    // aria-atomic is false so a new message is read by itself and the ones before it are not read again.
    <div className="cap-message" role="status" aria-label="Results and failures" aria-atomic="false" ref={regionRef}>
      {/* A new id per message is a new element, so the same words are announced again. */}
      {messages.map((m) => (
        <div key={m.id} className="cap-message-item" data-cap-part="item" data-id={m.id} data-lasting={lasting(m) ? "" : undefined} data-kind={kindOf(m)}>
          <svg className="cap-message-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: GLYPHS[kindOf(m)] }} />
          <p className="cap-message-text" data-cap-part="text">
            <span data-cap-part="said" role={m.failure ? "alert" : undefined}>
              {m.text}
            </span>
            {m.warning !== null ? (
              <span className="cap-message-warning">
                {" "}
                <b>Warning:</b> {m.warning}
              </span>
            ) : null}
            {m.error !== null ? (
              <span className="cap-message-error" role="alert">
                {m.error}
              </span>
            ) : null}
          </p>
          {m.undo ? (
            <button type="button" className="cap-link-btn cap-message-undo" data-cap-part="undo" aria-busy={m.busy || undefined} onClick={() => void runUndo(m.id)}>
              <span>{m.busy ? "Undoing..." : "Undo"}</span> <kbd aria-hidden="true">z</kbd>
            </button>
          ) : null}
          {!m.clears ? (
            <button type="button" className="cap-btn cap-message-dismiss" data-cap-part="dismiss" aria-disabled={m.busy || undefined} onClick={() => dismissOne(m.id)}>
              Dismiss
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
