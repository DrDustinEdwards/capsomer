import type { ContentLabels, IntentResult, MediaData, PickedMedia, SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../content/content.react.tsx";
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
}
export declare function MediaLibrary({ data, action, Form, submit, result, labels, mode, inspector, onPick }: MediaLibraryProps): import("react").JSX.Element;
