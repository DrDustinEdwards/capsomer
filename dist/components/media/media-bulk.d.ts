import { type BulkHandler } from "../bulk-bar/bulk-bar.ts";
import { type MediaFields } from "./media-record.ts";
export interface MediaOptions {
    save?: (key: string, fields: MediaFields) => Promise<void>;
    bin?: (keys: string[]) => Promise<void>;
    restore?: (keys: string[]) => Promise<void>;
    retry?: (key: string) => Promise<void>;
    delete?: (keys: string[]) => Promise<void>;
}
export interface BulkHost {
    options: MediaOptions;
    byKey: (key: string) => HTMLElement | null;
    refresh: () => void;
    counts: () => void;
    returnTo: () => HTMLElement | null;
}
export declare function createBulk({ options, byKey, refresh, counts, returnTo }: BulkHost): {
    bin: (keys: string[]) => Promise<boolean>;
    restore: (keys: string[]) => Promise<boolean>;
    handlers: () => Record<string, BulkHandler>;
};
