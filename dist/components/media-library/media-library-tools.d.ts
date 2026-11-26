import type { IntentResult, MediaData, SubmitIntent } from "../content/content.ts";
import { type MediaRecord } from "../media/media.ts";
import type { inspectorOffers } from "./media-library.ts";
export declare function pictureTools(item: MediaRecord, k: {
    offers: MediaData["offers"];
    can: MediaData["can"];
    iOffers: ReturnType<typeof inspectorOffers>;
    bytesHref?: (key: string) => string;
    submit?: SubmitIntent;
    run: (form: FormData) => Promise<IntentResult | null>;
    open: (key: string) => void;
}): {
    focus: boolean;
    replace: {
        accept: string;
        hint: string;
    } | null;
    crop: {
        src: string;
        asNew: boolean;
        inPlace: boolean;
        onSave: (file: File, how: "new" | "replace") => Promise<void>;
    } | null;
    keepsSize: boolean;
};
