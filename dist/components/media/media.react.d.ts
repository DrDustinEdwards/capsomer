import { type ComponentType, type FormHTMLAttributes, type Ref } from "react";
import { type MediaFields, type MediaRecord } from "./media.ts";
export { MediaTile, MediaGrid } from "./media-grid.react.tsx";
export type { MediaTileProps, MediaGroup, MediaGridProps } from "./media-grid.react.tsx";
export type { MediaFields, MediaRecord } from "./media.ts";
export type MediaMode = "pane" | "sheet";
export declare function useMediaMode(layout: {
    current: HTMLElement | null;
}): MediaMode;
export interface MediaInspectorProps {
    item: MediaRecord | null;
    open: boolean;
    mode: MediaMode;
    onSave: (key: string, fields: MediaFields) => Promise<void>;
    onClose: () => void;
    onBin?: (key: string) => void;
    onRestore?: (key: string) => void;
    onShowUnattached?: () => void;
    opener?: HTMLElement | null;
    onStep?: (dir: "prev" | "next") => void;
    id?: string;
    ref?: Ref<{
        focus: () => void;
    }>;
    show?: {
        alt?: boolean;
        title?: boolean;
        caption?: boolean;
        tags?: boolean;
    };
    saving?: "auto" | "form";
    action?: string;
    Form?: ComponentType<FormHTMLAttributes<HTMLFormElement> & {
        method?: "get" | "post";
    }>;
    closeHref?: string;
    can?: {
        trash?: boolean;
        delete?: boolean;
    };
    tools?: {
        focus?: boolean;
        replace?: {
            accept: string;
            hint: string;
        } | null;
        crop?: {
            src: string;
            asNew: boolean;
            inPlace: boolean;
            onSave: (file: File, how: "new" | "replace") => Promise<void>;
        } | null;
        keepsSize?: boolean;
    };
    onTool?: (form: FormData) => void;
}
export declare function MediaInspector(props: MediaInspectorProps): import("react").JSX.Element;
