import { type MouseEvent } from "react";
import type { IntentResult, MediaQuery } from "../content/content.ts";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
import type { MediaRecord } from "../media/media.ts";
export declare function useRouter(initial: MediaQuery): {
    query: MediaQuery;
    Form: FormComponent;
    onClickCapture: (e: MouseEvent) => void;
};
export declare function useSite(initial?: MediaRecord[], keepsSize?: boolean): {
    files: {
        key: string;
        name: string;
        url: string;
        thumb?: string;
        kind: "image" | "document";
        type: string;
        bytes: number;
        width?: number;
        height?: number;
        uploaded?: string;
        alt: string;
        altState: import("../media/media-record.ts").AltState;
        title: string;
        caption: string;
        tags: string[];
        used: import("../media/media-record.ts").UsedIn[];
        state: import("../media/media-record.ts").TileState;
        suggestedTags?: string[];
        progress?: number;
        error?: string;
        version?: string;
        usedUnknown?: boolean;
        focus?: string | null;
        usedCount?: number;
        credit?: string;
        license?: string;
        sourceUrl?: string | null;
        licenseExpires?: string | null;
        takenAt?: string | null;
        twins?: Array<{
            key: string;
            name: string;
        }>;
        orientation?: "landscape" | "portrait" | "square";
    }[];
    submit: (form: FormData) => Promise<IntentResult>;
    change: (f: (fs: MediaRecord[]) => MediaRecord[]) => void;
};
