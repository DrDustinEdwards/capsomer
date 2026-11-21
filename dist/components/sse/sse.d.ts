export interface SseEvent {
    event: string;
    data: string;
    id?: string;
}
export declare function parseEvent(block: string): SseEvent | null;
export declare function takeEvents(buffer: string): {
    events: SseEvent[];
    rest: string;
};
export declare function readSse(stream: ReadableStream<Uint8Array>, onEvent: (event: SseEvent) => void, signal?: AbortSignal): Promise<void>;
export declare function jsonData(e: SseEvent): unknown;
