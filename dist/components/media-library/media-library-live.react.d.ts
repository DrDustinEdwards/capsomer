import type { MediaData } from "../content/content.ts";
import type { MediaRecord } from "../media/media.ts";
import type { MediaLibraryProps } from "./media-library-model.react.tsx";
export declare function useLiveRows(data: MediaData, changes: MediaLibraryProps["changes"], picker: boolean): {
    changed: ReadonlyMap<string, MediaRecord | null>;
    polling: boolean;
    stale: boolean;
    live: {
        rows: MediaRecord[];
        elsewhere: number;
        updated: number;
    };
};
