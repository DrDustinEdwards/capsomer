import { type BulkHandler } from "../bulk-bar/bulk-bar.ts";
import { type MediaRecord } from "./media-record.ts";
import { type MediaOptions } from "./media-bulk.ts";
export * from "./media-record.ts";
export * from "./media-grid.ts";
export * from "./media-autosave.ts";
export * from "./media-actions.ts";
export * from "./media-crop.ts";
export type { MediaOptions } from "./media-bulk.ts";
export { buildTile, recordOf, syncTile, writeRecord } from "./media-tile.ts";
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
