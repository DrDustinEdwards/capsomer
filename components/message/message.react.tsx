import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  kindGlyph,
  currentUndo,
  isUndoKey,
  messageKind,
  lasting,
  newMessage,
  resolveFocus,
  syncTimers,
  undoBusy,
  undoDone,
  undoFailed,
  withMessage,
  type Message,
  type SayOptions,
} from "./message.ts";
import { markup } from "../trusted-html/trusted-html.ts";

export type { Message, SayOptions };

export interface MessageApi {
  say: (text: string, opts?: SayOptions) => void;
  fail: (text: string) => void;
  dismiss: () => void;
}

interface Settle {
  to?: HTMLElement | null;
  id?: number;
  origin?: boolean;
}

interface Ctx extends MessageApi {
  messages: Message[];
  runUndo: (id?: number) => Promise<void>;
  dismissOne: (id: number) => void;
  regionRef: RefObject<HTMLDivElement | null>;
}

const MessageContext = createContext<Ctx | null>(null);

export interface MessageProviderProps {
  children: ReactNode;
  region?: boolean;
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
  const settle = useRef<Settle | null>(null);

  const commit: (next: Message[], s?: Settle) => void = useCallback(
    (next: Message[], s?: Settle) => {
      if (s?.to || regionRef.current?.contains(document.activeElement)) settle.current = s ?? {};
      live.current = next;
      setMessages(next);
      syncTimers(timers.current, next, (id) =>
        // oxlint-disable-next-line react/immutability -- the timer calls commit long after it is defined
        commit(
          live.current.filter((x) => x.id !== id),
          { origin: true },
        ),
      );
    },
    [],
  );

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
      if (active && active !== document.body && !regionRef.current?.contains(active))
        origin.current = active;
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
      const m =
        id === undefined ? currentUndo(live.current) : live.current.find((x) => x.id === id);
      if (!m?.undo || m.busy) return;
      const run = m.undo;
      commit(undoBusy(live.current, m.id));
      try {
        await run();
      } catch (err) {
        if (live.current.some((x) => x.id === m.id)) commit(undoFailed(live.current, m.id, err));
        return;
      }
      const to = resolveFocus(m.returnFocus);
      if (!live.current.some((x) => x.id === m.id)) return;
      commit(
        undoDone(live.current, m, () => nextId.current++),
        { to, id: m.id },
      );
    },
    [commit],
  );

  // After a render that removed the focused button, focus goes where the caller said, else the message's Dismiss, else the cause, else main.
  useEffect(() => {
    const s = settle.current;
    if (!s) return;
    settle.current = null;
    if (s.to) return s.to.focus();
    const region = regionRef.current;
    if (region?.contains(document.activeElement)) return;
    const back =
      origin.current instanceof HTMLElement && origin.current.isConnected ? origin.current : null;
    if (s.origin) return (back ?? document.querySelector<HTMLElement>("main"))?.focus();
    const own =
      s.id === undefined
        ? null
        : region?.querySelector<HTMLElement>(`[data-id="${s.id}"] [data-cap-part="dismiss"]`);
    const any = own ?? region?.querySelector<HTMLElement>("[data-cap-part='dismiss']");
    if (any) return any.focus();
    (back ?? document.querySelector<HTMLElement>("main"))?.focus();
  }, [messages]);

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

  const value = useMemo<Ctx>(
    () => ({ say, fail, dismiss, messages, runUndo, dismissOne, regionRef }),
    [say, fail, dismiss, messages, runUndo, dismissOne],
  );
  return (
    <MessageContext.Provider value={value}>
      {children}
      {region ? <MessageRegion /> : null}
    </MessageContext.Provider>
  );
}

export function useMessage(): MessageApi {
  const api = useOptionalMessage();
  if (!api) throw new Error("useMessage needs a <MessageProvider> above it.");
  return api;
}

// The same API, or null when no <MessageProvider> is above. One object while the provider's callbacks hold, so effects depending on it do not re-run.
export function useOptionalMessage(): MessageApi | null {
  const ctx = useContext(MessageContext);
  const { say, fail, dismiss } = ctx ?? {};
  return useMemo(
    () => (say && fail && dismiss ? { say, fail, dismiss } : null),
    [say, fail, dismiss],
  );
}

// One region per page; it has no data-cap attribute, so the plain behavior module never attaches to a region React owns.
export function MessageRegion() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("MessageRegion needs a <MessageProvider> above it.");
  const { messages, runUndo, dismissOne, regionRef } = ctx;
  return (
    // aria-atomic is false so a new message is read by itself and the ones before it are not read again.
    <div
      className="cap-message"
      role="status"
      aria-label="Results and failures"
      aria-atomic="false"
      ref={regionRef}
    >
      {/* A new id per message is a new element, so the same words are announced again. */}
      {messages.map((m) => (
        <div
          key={m.id}
          className="cap-message-item"
          data-cap-part="item"
          data-id={m.id}
          data-lasting={lasting(m) ? "" : undefined}
          data-kind={messageKind(m)}
        >
          <svg
            className="cap-message-glyph"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
            dangerouslySetInnerHTML={markup(kindGlyph(messageKind(m)))}
          />
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
            <button
              type="button"
              className="cap-link-btn cap-message-undo"
              data-cap-part="undo"
              aria-busy={m.busy || undefined}
              onClick={() => void runUndo(m.id)}
            >
              <span>{m.busy ? "Undoing..." : "Undo"}</span> <kbd aria-hidden="true">z</kbd>
            </button>
          ) : null}
          {!m.clears ? (
            <button
              type="button"
              className="cap-btn cap-message-dismiss"
              data-cap-part="dismiss"
              aria-disabled={m.busy || undefined}
              onClick={() => dismissOne(m.id)}
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
