import type { ContentLabels, IntentResult, MediaData, PickedMedia, SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../content/content.react.tsx";
import { type MediaRecord } from "../media/media.ts";
export type { FormComponent, IntentResult, MediaData, PickedMedia, SubmitIntent };
export interface MediaLibraryProps {
    data: MediaData;
    action: string;
    Form?: FormComponent;
    submit?: SubmitIntent;
    result?: IntentResult | null;
    labels?: ContentLabels;
    mode?: "library" | "picker";
    inspector?: "form" | "autosave";
    onPick?: (picked: PickedMedia) => void;
    search?: (query: string, signal: AbortSignal) => Promise<MediaRecord[]>;
    shortcuts?: boolean;
    bytesHref?: (key: string) => string;
}
export declare function MediaLibrary({ data, action, Form, submit, result, labels, mode, inspector, onPick, search, shortcuts, bytesHref }: MediaLibraryProps): import("react").JSX.Element;
