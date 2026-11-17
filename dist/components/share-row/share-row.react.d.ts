import type { ReactNode } from "react";
import { type ShareTarget } from "./share-row.ts";
export interface ShareRowProps {
    url: string;
    title: string;
    targets?: ShareTarget[];
    label?: ReactNode;
    children?: ReactNode;
}
export declare function ShareRow({ url, title, targets, label, children, }: ShareRowProps): import("react").JSX.Element;
