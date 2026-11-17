import type { ReactNode } from "react";
export interface FeatureBlockProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    body?: ReactNode;
    media?: ReactNode;
    scrollLabel?: string;
    layout?: "stacked" | "beside";
    alignStart?: boolean;
    lifted?: boolean;
    headingLevel?: "h2" | "h3" | "h4";
    id?: string;
}
export declare function FeatureBlock({ eyebrow, title, body, media, scrollLabel, layout, alignStart, lifted, headingLevel: H, id, }: FeatureBlockProps): import("react").JSX.Element;
export declare function Features({ children, alternate }: {
    children: ReactNode;
    alternate?: boolean;
}): import("react").JSX.Element;
export interface FeatureCardItem {
    icon?: ReactNode;
    title: ReactNode;
    text?: ReactNode;
    tag?: ReactNode;
    id?: string;
    attributes?: Record<`data-${string}`, string>;
}
export declare function FeatureCard({ icon, title, text, tag, attributes, headingLevel: H, }: FeatureCardItem & {
    headingLevel?: "h2" | "h3" | "h4" | "p";
}): import("react").JSX.Element;
export declare function FeatureGrid({ items, headingLevel, ordered, label, }: {
    items: FeatureCardItem[];
    headingLevel?: "h2" | "h3" | "h4" | "p";
    ordered?: boolean;
    label?: string;
}): import("react").JSX.Element;
