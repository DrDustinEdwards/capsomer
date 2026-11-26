import { type IntentResult, type MediaData, type PickedMedia, type SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type KitMediaChanges } from "./media-library.ts";
import { type MediaLibraryProps } from "./media-library-model.react.tsx";
export type { MediaLibraryProps };
export type { FormComponent, IntentResult, KitMediaChanges, MediaData, PickedMedia, SubmitIntent };
export declare function MediaLibrary(props: MediaLibraryProps): import("react").JSX.Element;
