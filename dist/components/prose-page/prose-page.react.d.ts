import type { ReactNode } from "react";
export interface ProsePageProps {
    title: ReactNode;
    lead?: ReactNode;
    children: ReactNode;
    headExtra?: ReactNode;
    titleId?: string;
}
export declare function ProsePage({ title, lead, children, headExtra, titleId }: ProsePageProps): import("react").JSX.Element;
