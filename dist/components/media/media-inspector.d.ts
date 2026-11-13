import { type MediaFields, type MediaRecord } from "./media-record.ts";
import type { SaveState } from "./media-autosave.ts";
export declare function readFields(inspector: ParentNode | null): MediaFields;
export declare function renderSave(inspector: ParentNode | null, state: SaveState, error?: string): void;
export declare function fillInspector(inspector: ParentNode, r: MediaRecord, draft: MediaFields | undefined): void;
export declare function renderTags(inspector: ParentNode | null, tags: string[], suggested: string[]): void;
