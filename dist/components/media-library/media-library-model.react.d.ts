import { type FormEvent, type KeyboardEvent } from "react";
import { type Command } from "../command-menu/command-menu.react.tsx";
import { type ContentLabels, type IntentResult, type MediaData, type MediaQuery, type PickedMedia, type SubmitIntent } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type MediaRecord } from "../media/media.ts";
import { type KitMediaChanges } from "./media-library.ts";
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
    changes?: (cursor: string, signal: AbortSignal) => Promise<KitMediaChanges | {
        reload: true;
    }>;
}
export declare function useMediaLibrary({ data, action, Form, submit, result, labels, mode, inspector, onPick, search, shortcuts, bytesHref, changes, }: MediaLibraryProps): {
    Form: FormComponent;
    action: string;
    active: string;
    bulk: import("./media-library.ts").OfferedAction[];
    can: import("../content/content.ts").ContentCan;
    canImport: boolean;
    canUpload: boolean;
    copied: string;
    data: MediaData;
    dir: "desc" | "asc";
    display: string;
    filterWords: string;
    filters: boolean;
    find: (text: string, signal: AbortSignal) => Promise<Command[]>;
    finding: boolean;
    formId: string;
    go: (q: MediaQuery) => void;
    goRef: import("react").RefObject<HTMLDivElement | null>;
    goTo: MediaQuery | null;
    groups: {
        label: string;
        items: MediaRecord[];
    }[] | null;
    href: (q: MediaQuery) => string;
    iOffers: {
        alt: boolean;
        tags: boolean;
        trash: boolean;
        delete: boolean;
        focus: boolean;
        caption: boolean;
        replace: boolean;
        credit: boolean;
        transform: boolean;
        revert: boolean;
        resize: number | null;
        suggest: boolean;
        embedded: boolean;
        twins: boolean;
    };
    insRef: import("react").RefObject<{
        focus: () => void;
    } | null>;
    inspected: MediaRecord | null;
    inspectedMoved: boolean;
    inspector: "form" | "autosave";
    inspectorMode: import("../media/media.react.tsx").MediaMode;
    intents: import("../content/content.react.tsx").Intents;
    labels: ContentLabels | undefined;
    layout: "grid" | "list";
    layoutRef: import("react").RefObject<HTMLDivElement | null>;
    lensHint: string | undefined;
    lenses: {
        id: string;
        label: string;
        hint?: string;
        count?: number;
    }[];
    live: {
        rows: MediaRecord[];
        elsewhere: number;
        updated: number;
    };
    mounted: boolean;
    nameOf: (id: string) => string;
    offers: import("../content/content.ts").MediaOffers;
    onGridKey: (e: KeyboardEvent<HTMLElement>) => void;
    onSubmit: (e: FormEvent<HTMLElement>) => void;
    openFile: (key: string) => void;
    page: import("../content/content.ts").PageInfo & {
        changeCursor?: string;
    };
    path: string;
    pick: MediaRecord | undefined;
    pickAlt: import("react").RefObject<HTMLTextAreaElement | null>;
    pickSuggestion: string;
    picker: boolean;
    plural: string;
    polling: boolean;
    query: MediaQuery;
    remember: (change: Pick<MediaQuery, "layout" | "size">) => void;
    rows: MediaRecord[];
    rules: {
        accept: string;
        hint: string;
    } | null;
    save: (key: string, fields: import("../media/media-record.ts").MediaFields) => Promise<void>;
    search: ((query: string, signal: AbortSignal) => Promise<MediaRecord[]>) | undefined;
    selectable: boolean;
    selected: string[];
    setActive: import("react").Dispatch<import("react").SetStateAction<string>>;
    setChosen: import("react").Dispatch<import("react").SetStateAction<string | undefined>>;
    setFinding: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setLast: import("react").Dispatch<import("react").SetStateAction<IntentResult | null>>;
    setSelected: import("react").Dispatch<import("react").SetStateAction<string[]>>;
    setUploadOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    shortcuts: boolean;
    shown: MediaRecord[];
    shrinkAll: (MediaRecord & {
        version: string;
    })[];
    sort: "size" | "name" | "used" | "added";
    stale: boolean;
    submit: SubmitIntent | undefined;
    suggestions: import("../content/content.ts").MediaSuggestions | null | undefined;
    tileSize: "s" | "m" | "l";
    title: string;
    toOpen: {
        id: string;
        why: "duplicate" | "new" | "copy";
    }[];
    uploads: boolean;
    tools: (item: MediaRecord) => {
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
    trash: boolean;
    uid: string;
    uploadOpen: boolean;
    withheld: string[];
    words: {
        kind: "nothing-yet" | "no-match" | "all-clear";
        title: string;
    };
};
export type Model = ReturnType<typeof useMediaLibrary>;
