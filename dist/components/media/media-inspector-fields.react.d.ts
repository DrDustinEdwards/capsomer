import { type MediaFields, type MediaRecord } from "./media.ts";
import type { MediaInspectorProps } from "./media.react.tsx";
type Edit = (patch: Partial<MediaFields>, now?: boolean) => void;
export declare function InspectorFields({ item, base, fields, edit, formMode, F, action, shows, firstRef, }: {
    item: MediaRecord;
    base: string;
    fields: MediaFields;
    edit: Edit;
    formMode: boolean;
    F: NonNullable<MediaInspectorProps["Form"]>;
    action?: string;
    shows: {
        alt: boolean;
        title: boolean;
        caption: boolean;
        tags: boolean;
    };
    firstRef: {
        current: HTMLElement | null;
    };
}): import("react").JSX.Element;
export {};
