import { type AnchorStatus, type Flag as FlagData } from "./flag-list.ts";
export interface FlagProps {
    flag: FlagData;
    anchor: AnchorStatus;
    owner: boolean;
    ownerName?: string;
    idPrefix: string;
    onResolve: () => void;
    onDismiss: () => void;
    onReopen: () => void;
    onApply: () => void;
    now?: number;
}
export declare function Flag({ flag, anchor, owner, ownerName, idPrefix, onResolve, onDismiss, onReopen, onApply, now, }: FlagProps): import("react").JSX.Element;
