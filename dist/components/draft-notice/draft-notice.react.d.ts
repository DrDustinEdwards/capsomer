import type { ReactNode } from "react";
export interface DraftNoticeProps {
    show?: boolean;
    label?: string;
    children?: ReactNode;
}
export declare function DraftNotice({ show, label, children, }: DraftNoticeProps): import("react").JSX.Element | null;
