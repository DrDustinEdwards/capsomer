// Server-sent events read from a fetch() body, for a stream a POST starts (EventSource only GETs). Framing follows the WHATWG
// HTML standard 9.2: a blank line dispatches, `event:` names it, `data:` lines join, `id:` is kept, `retry:` ignored. No DOM.

export interface SseEvent {
  event: string;
  data: string;
  id?: string;
}

export function parseEvent(block: string): SseEvent | null {
  let event = "message";
  let id: string | undefined;
  const data: string[] = [];
  for (const line of block.split(/\r\n|\r|\n/)) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value || "message";
    else if (field === "data") data.push(value);
    else if (field === "id" && !value.includes("\0")) id = value;
  }
  if (data.length === 0) return null;
  return id === undefined ? { event, data: data.join("\n") } : { event, data: data.join("\n"), id };
}

export function takeEvents(buffer: string): { events: SseEvent[]; rest: string } {
  const parts = buffer.split(/\r\n\r\n|\n\n|\r\r/);
  const rest = parts.pop() ?? "";
  const events: SseEvent[] = [];
  for (const part of parts) {
    const e = parseEvent(part);
    if (e) events.push(e);
  }
  return { events, rest };
}

// Reads a stream to its end, calling onEvent for each event in order. An event left unended at the end of the stream
// is dispatched too (a server that closes without the last blank line). Stops early when `signal` aborts.
export async function readSse(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });
      if (done) buffer += decoder.decode();
      const taken = takeEvents(buffer);
      buffer = taken.rest;
      for (const e of taken.events) onEvent(e);
      if (done) {
        const last = parseEvent(buffer);
        if (last) onEvent(last);
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// An event's data as JSON, or undefined for data that is not JSON or is the `[DONE]` sentinel model APIs send last.
export function jsonData(e: SseEvent): unknown {
  if (e.data === "[DONE]") return undefined;
  try {
    return JSON.parse(e.data);
  } catch {
    return undefined;
  }
}
