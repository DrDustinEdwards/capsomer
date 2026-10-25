import { type ReactNode } from "react";
import { type Rejection } from "./drop-zone.ts";
export interface DropZoneProps {
    accept?: string;
    maxBytes?: number;
    maxFiles?: number;
    multiple?: boolean;
    name?: string;
    disabled?: boolean;
    scope?: "zone" | "page";
    paste?: boolean;
    title?: ReactNode;
    hint?: ReactNode;
    onAccepted?: (files: File[], rejected: Rejection[]) => void;
    onRejected?: (rejected: Rejection[], accepted: File[]) => void;
    id?: string;
}
export declare function DropZone({ accept, maxBytes, maxFiles, multiple, name, disabled, scope, paste, title, hint, onAccepted, onRejected, id }: DropZoneProps): import("react").JSX.Element;
