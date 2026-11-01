import { type ReactNode } from "react";
import { type Kind } from "./authorship.ts";
export type { Kind };
export interface RunProps {
    kind: Kind;
    block?: boolean;
    badge?: ReactNode;
    children?: ReactNode;
}
export declare function Run({ kind, block, badge, children }: RunProps): import("react").JSX.Element;
export interface AuthorshipProps {
    shown?: boolean;
    onShownChange?: (shown: boolean) => void;
    defaultShown?: boolean;
    remember?: boolean;
    children: ReactNode;
}
export declare function Authorship({ shown, onShownChange, defaultShown, remember, children }: AuthorshipProps): import("react").JSX.Element;
