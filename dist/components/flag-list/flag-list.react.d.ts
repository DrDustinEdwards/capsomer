import { type ReactNode } from "react";
import { type SayOptions } from "../message/message.ts";
import { type AnchorStatus, type Flag as FlagData } from "./flag-list.ts";
export type { AnchorStatus, Flag as FlagData, FlagKind, Resolution } from "./flag-list.ts";
type FilterValue = "open" | "resolved" | "all";
export interface FlagListProps {
    label: ReactNode;
    flags: FlagData[];
    onFlagsChange?: (flags: FlagData[]) => void;
    text?: string;
    onTextChange?: (text: string) => void;
    owner?: boolean;
    ownerName?: string;
    viewer?: string;
    say?: (text: string, opts?: SayOptions) => void;
    fail?: (text: string) => void;
    filter?: FilterValue;
    primary?: boolean;
}
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
export declare function Flag({ flag, anchor, owner, ownerName, idPrefix, onResolve, onDismiss, onReopen, onApply, now }: FlagProps): import("react").JSX.Element;
export declare function FlagList({ label, flags: given, onFlagsChange, text, onTextChange, owner, ownerName, viewer, say, fail, filter: initial, primary }: FlagListProps): import("react").JSX.Element;
