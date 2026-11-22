import { type BulkHandler } from "../bulk-bar/bulk-bar.ts";
import { type MediaFields, type MediaRecord } from "./media-record.ts";
export * from "./media-record.ts";
export * from "./media-grid.ts";
export * from "./media-autosave.ts";
export * from "./media-actions.ts";
export * from "./media-crop.ts";
export { buildTile, glyph, recordOf, syncTile, writeRecord } from "./media-tile.ts";
export interface MediaOptions {
    save?: (key: string, fields: MediaFields) => Promise<void>;
    bin?: (keys: string[]) => Promise<void>;
    restore?: (keys: string[]) => Promise<void>;
    retry?: (key: string) => Promise<void>;
    delete?: (keys: string[]) => Promise<void>;
}
export interface MediaController {
    open(key: string): void;
    close(): void;
    setActive(key: string): void;
    selectedKeys(): string[];
    add(record: MediaRecord): HTMLElement;
    update(key: string, patch: Partial<MediaRecord>): void;
    bin(keys: string[]): Promise<boolean>;
    restore(keys: string[]): Promise<boolean>;
    bulkHandlers(): Record<string, BulkHandler>;
    refresh(): void;
    detach(): void;
}
export declare function controllerFor(root: HTMLElement | null): MediaController | undefined;
export declare function attachMedia(root: HTMLElement, options?: MediaOptions): MediaController;
export declare function enhance(root?: ParentNode): () => void;
