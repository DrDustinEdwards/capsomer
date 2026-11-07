import type { FormComponent, IntentResult } from "../media-library/media-library.react.tsx";
export declare const KitForm: FormComponent;
/** With script each intent posts to the screen's JSON endpoint, and the page reads its data again after it. */
export declare function useKitSubmit(endpoint: string): (form: FormData) => Promise<IntentResult>;
