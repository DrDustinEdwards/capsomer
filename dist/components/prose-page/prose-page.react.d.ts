import type { ReactNode } from "react";
export interface ProsePageHeadProps {
    title: ReactNode;
    headExtra?: ReactNode;
    titleId?: string;
}
export interface ProsePageProps extends ProsePageHeadProps {
    children?: ReactNode;
    html?: string;
}
export declare function ProsePageHead({ title, headExtra, titleId }: ProsePageHeadProps): import("react").JSX.Element;
export declare function ProsePage({ children, html, ...head }: ProsePageProps): import("react").JSX.Element;
