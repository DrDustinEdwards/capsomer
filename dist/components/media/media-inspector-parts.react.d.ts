import { type ReactNode } from "react";
import { type MediaRecord, type SaveState } from "./media.ts";
import type { MediaInspectorProps } from "./media.react.tsx";
export declare function Ident({ item, intent }: {
    item: MediaRecord;
    intent: string;
}): import("react").JSX.Element;
export declare function Wrap({ on, F, action, label, intent, item, save, children, }: {
    on: boolean;
    F: NonNullable<MediaInspectorProps["Form"]>;
    action?: string;
    label: string;
    intent: string;
    item: MediaRecord;
    save: string;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function AddressCopy({ base, url, snippets, }: {
    base: string;
    url: string;
    snippets: Array<{
        id: string;
        name: string;
        label: string;
        value: string;
    }>;
}): import("react").JSX.Element;
export declare function FactsUsed({ item, base, onShowUnattached, }: {
    item: MediaRecord;
    base: string;
    onShowUnattached?: () => void;
}): import("react").JSX.Element;
export declare function InspectorFooter({ item, state, error, onRetry, formMode, F, action, can, onBin, onRestore, onClose, closeHref, }: {
    item: MediaRecord;
    state: SaveState;
    error?: string;
    onRetry: () => void;
    formMode: boolean;
    F: NonNullable<MediaInspectorProps["Form"]>;
    action?: string;
    can: NonNullable<MediaInspectorProps["can"]>;
    onBin?: (key: string) => void;
    onRestore?: (key: string) => void;
    onClose: () => void;
    closeHref?: string;
}): import("react").JSX.Element;
