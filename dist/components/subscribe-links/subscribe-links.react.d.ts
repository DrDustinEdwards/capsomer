import type { ReactNode } from "react";
export interface SubscribeLink {
    href: string;
    label: ReactNode;
    icon?: ReactNode;
    away?: boolean;
}
export interface SubscribeLinksProps {
    title?: ReactNode;
    headingId?: string;
    level?: "h2" | "h3";
    links: SubscribeLink[];
    more?: {
        href: string;
        label: ReactNode;
    };
    renderLink?: (props: {
        href: string;
        className: string;
        children: ReactNode;
    }) => ReactNode;
}
export declare function SubscribeLinks({ title, headingId, level: H, links, more, renderLink, }: SubscribeLinksProps): import("react").JSX.Element | null;
