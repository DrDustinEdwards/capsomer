import { type ReactNode } from "react";
export declare function telHref(number: string, country?: string): string;
export interface ContactWay {
    label: ReactNode;
    href: string;
    icon?: ReactNode;
    iconEnd?: ReactNode;
}
export interface ContactLine {
    label: ReactNode;
    numbers: string[];
    join?: string;
}
export interface ContactCardProps {
    title: ReactNode;
    headingLevel?: "h2" | "h3" | "h4";
    text?: ReactNode;
    ways?: ContactWay[];
    wayColumns?: 1 | 2 | 3;
    lines?: ContactLine[];
    address?: string[];
    mapHref?: string;
    country?: string;
    children?: ReactNode;
}
export declare function ContactCard({ title, headingLevel: H, text, ways, wayColumns, lines, address, mapHref, country, children, }: ContactCardProps): import("react").JSX.Element;
export declare function ContactGrid({ children, plain }: {
    children: ReactNode;
    plain?: boolean;
}): import("react").JSX.Element;
