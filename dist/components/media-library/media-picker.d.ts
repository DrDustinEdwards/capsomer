import type { MediaData } from "../content/content.ts";
export declare const libraryOf: (endpoint: string) => string;
export declare const loadMediaView: (endpoint: string, query?: string) => Promise<MediaData>;
export interface UploadedImage {
    url: string;
    src: string;
}
export declare function uploadImage(endpoint: string, file: File, image: {
    alt: string;
    decorative: boolean;
}, signal?: AbortSignal): Promise<UploadedImage>;
