// The data layer's plain parts: what a request came to (Answer), the JSON reads and posts that
// produce it, a page-wide signed-out flag, and the live room's reconnect wait. No React here: the
// hooks are in data.react.tsx.

import { errorText } from "../dialog/dialog.ts";

/** What a request came to. A refusal carries the server's own text, never a bare status. */
export type Answer<T> =
  | { kind: "ok"; value: T }
  | { kind: "refused"; status: number; message: string }
  | { kind: "expired"; message: string }
  | { kind: "signed-out" }
  | { kind: "error"; message: string };

export type Failure = Exclude<Answer<never>, { kind: "ok" }>;

/**
 * The session ended: Access answers with a redirect to its login, or the Worker answers 401, or 403
 * when `forbidden` (an action endpoint answers 403 for a CSRF or cross-site refusal, with its text,
 * so it passes false and shows that text). `redirect: "manual"` keeps a cross-origin login redirect
 * from surfacing as an opaque network error.
 */
export function sessionEnded(res: Response, forbidden = true): boolean {
  return (
    res.type === "opaqueredirect" ||
    res.redirected ||
    res.status === 401 ||
    (forbidden && res.status === 403) ||
    (res.status >= 300 && res.status < 400)
  );
}

// The server's words: its text, or the `error` of a JSON body ({ "error": "..." }).
async function refusalText(res: Response): Promise<string> {
  const text = (await res.text().catch(() => "")).trim();
  try {
    const { error } = JSON.parse(text) as { error?: unknown };
    if (typeof error === "string" && error) return error;
  } catch {
    // Not JSON: the text is the words.
  }
  return text || `The server answered ${res.status} with no text`;
}

/** A response as an Answer: 410 is expired (a preview token that lapsed); a non-JSON success is an error. */
export async function answerOf<T>(res: Response, forbidden = true): Promise<Answer<T>> {
  if (sessionEnded(res, forbidden)) return { kind: "signed-out" };
  if (res.status === 410) return { kind: "expired", message: await refusalText(res) };
  if (!res.ok) return { kind: "refused", status: res.status, message: await refusalText(res) };
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json"))
    return {
      kind: "error",
      message: `The server answered ${res.status} with ${type || "no content type"}, not JSON`,
    };
  return { kind: "ok", value: (await res.json()) as T };
}

function thrown(e: unknown): Answer<never> {
  return { kind: "error", message: errorText(e) };
}

/** GET a JSON route on this origin, never cached, as an Answer. */
export async function getAnswer<T>(
  url: string,
  { headers = {} }: { headers?: Record<string, string> } = {},
): Promise<Answer<T>> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      redirect: "manual",
      cache: "no-store",
      headers: { accept: "application/json", ...headers },
    });
    return await answerOf<T>(res, true);
  } catch (e) {
    return thrown(e);
  }
}

/** The words for a request that had no answer in time. */
export const NO_ANSWER = (seconds: number) =>
  `no answer within ${seconds} seconds. Check whether anything changed before trying again.`;

/**
 * POST JSON to a route on this origin as an Answer. A request with no answer within `timeoutMs`
 * (20 s) is aborted and says so, so a dialog never stays busy with nothing said. A 403 is the
 * server's refusal (CSRF, cross-site), not a sign-out.
 */
export async function postAnswer<T>(
  url: string,
  body: unknown,
  {
    headers = {},
    timeoutMs = 20_000,
    timeoutMessage = NO_ANSWER,
  }: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    timeoutMessage?: (seconds: number) => string;
  } = {},
): Promise<Answer<T>> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
      cache: "no-store",
      headers: { "Content-Type": "application/json", accept: "application/json", ...headers },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
    return await answerOf<T>(res, false);
  } catch (e) {
    if (abort.signal.aborted)
      return { kind: "error", message: timeoutMessage(Math.round(timeoutMs / 1000)) };
    return thrown(e);
  } finally {
    clearTimeout(timer);
  }
}

/** Thrown by a read whose session ended, so every query stops the same way. */
export class SignedOut extends Error {
  constructor() {
    super("signed out");
    this.name = "SignedOut";
  }
}

/** An Answer's value, or a throw: SignedOut, or an Error carrying the server's text. */
export async function ask<T>(read: () => Promise<Answer<T>>): Promise<T> {
  const r = await read();
  if (r.kind === "ok") return r.value;
  if (r.kind === "signed-out") throw new SignedOut();
  throw new Error(r.kind === "refused" ? `HTTP ${r.status}: ${r.message}` : r.message);
}

/** A boolean the whole page shares and listens to: signed out, offline. */
export interface Flag {
  get(): boolean;
  set(next: boolean): void;
  subscribe(listener: () => void): () => void;
}

export function createFlag(initial = false): Flag {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      if (value === next) return;
      value = next;
      for (const l of listeners) l();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

/**
 * How long a live room waits before reconnecting after its `attempt`th drop: exponential from
 * `base` (1 s) to `max` (30 s), with full jitter so a restart does not bring every tab back in the
 * same second (AWS Architecture Blog, "Exponential Backoff And Jitter").
 */
export function reconnectDelay(
  attempt: number,
  {
    base = 1000,
    max = 30_000,
    random = Math.random,
  }: {
    base?: number;
    max?: number;
    random?: () => number;
  } = {},
): number {
  const ceiling = Math.min(max, base * 2 ** Math.max(0, attempt));
  return Math.round(ceiling * random());
}

/** The ws: or wss: address for a path on `origin` (this page's by default). */
export function socketUrl(path: string, origin = globalThis.location.origin): string {
  return `${origin.replace(/^http/, "ws")}${path}`;
}
