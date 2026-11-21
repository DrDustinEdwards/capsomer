/** What a request came to. A refusal carries the server's own text, never a bare status. */
export type Answer<T> = {
    kind: "ok";
    value: T;
} | {
    kind: "refused";
    status: number;
    message: string;
} | {
    kind: "expired";
    message: string;
} | {
    kind: "signed-out";
} | {
    kind: "error";
    message: string;
};
export type Failure = Exclude<Answer<never>, {
    kind: "ok";
}>;
/**
 * The session ended: Access answers with a redirect to its login, or the Worker answers 401, or 403
 * when `forbidden` (an action endpoint answers 403 for a CSRF or cross-site refusal, with its text,
 * so it passes false and shows that text). `redirect: "manual"` keeps a cross-origin login redirect
 * from surfacing as an opaque network error.
 */
export declare function sessionEnded(res: Response, forbidden?: boolean): boolean;
/** A response as an Answer: 410 is expired (a preview token that lapsed); a non-JSON success is an error. */
export declare function answerOf<T>(res: Response, forbidden?: boolean): Promise<Answer<T>>;
/** GET a JSON route on this origin, never cached, as an Answer. */
export declare function getAnswer<T>(url: string, { headers }?: {
    headers?: Record<string, string>;
}): Promise<Answer<T>>;
/** The words for a request that had no answer in time. */
export declare const NO_ANSWER: (seconds: number) => string;
/**
 * POST JSON to a route on this origin as an Answer. A request with no answer within `timeoutMs`
 * (20 s) is aborted and says so, so a dialog never stays busy with nothing said. A 403 is the
 * server's refusal (CSRF, cross-site), not a sign-out.
 */
export declare function postAnswer<T>(url: string, body: unknown, { headers, timeoutMs, timeoutMessage, }?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    timeoutMessage?: (seconds: number) => string;
}): Promise<Answer<T>>;
/** Thrown by a read whose session ended, so every query stops the same way. */
export declare class SignedOut extends Error {
    constructor();
}
/** An Answer's value, or a throw: SignedOut, or an Error carrying the server's text. */
export declare function ask<T>(read: () => Promise<Answer<T>>): Promise<T>;
/** A boolean the whole page shares and listens to: signed out, offline. */
export interface Flag {
    get(): boolean;
    set(next: boolean): void;
    subscribe(listener: () => void): () => void;
}
export declare function createFlag(initial?: boolean): Flag;
/**
 * How long a live room waits before reconnecting after its `attempt`th drop: exponential from
 * `base` (1 s) to `max` (30 s), with full jitter so a restart does not bring every tab back in the
 * same second (AWS Architecture Blog, "Exponential Backoff And Jitter").
 */
export declare function reconnectDelay(attempt: number, { base, max, random, }?: {
    base?: number;
    max?: number;
    random?: () => number;
}): number;
/** The ws: or wss: address for a path on `origin` (this page's by default). */
export declare function socketUrl(path: string, origin?: string): string;
