import { type ReactNode } from "react";
export interface HeroProps {
    title: ReactNode;
    eyebrow?: ReactNode;
    lead?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
    note?: ReactNode;
    aside?: ReactNode;
    backdrop?: ReactNode;
    align?: "start" | "center";
    card?: boolean;
    headingLevel?: "h1" | "h2";
    id?: string;
    className?: string;
}
export declare function Hero(props: HeroProps): import("react").JSX.Element;
