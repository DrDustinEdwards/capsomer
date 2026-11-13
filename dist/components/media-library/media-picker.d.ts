import type { MediaData } from "../content/content.ts";
export declare const libraryOf: (endpoint: string) => string;
export declare function loadMediaView(endpoint: string, query?: string, signal?: AbortSignal): Promise<MediaData>;
export interface UploadedImage {
    url: string;
    src: string;
}
export declare function uploadImage(endpoint: string, file: File, image: {
    alt: string;
    decorative: boolean;
}, signal?: AbortSignal): Promise<UploadedImage>;
