import type { SubmitIntent } from "../content/content.ts";
import type { MediaFields } from "../media/media.react.tsx";
import type { MediaRecord } from "../media/media.ts";
import type { inspectorOffers } from "./media-library.ts";
export declare function useInspectorSave(submit: SubmitIntent | undefined, rows: readonly MediaRecord[], inspected: MediaRecord | null, iOffers: ReturnType<typeof inspectorOffers>): (key: string, fields: MediaFields) => Promise<void>;
