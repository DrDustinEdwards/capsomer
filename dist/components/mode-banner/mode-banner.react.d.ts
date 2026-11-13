import type { ReactNode } from "react";
export type ModeBannerProps = {
    mode: "demo";
    signedIn?: boolean;
    actions?: ReactNode;
} | {
    mode: "view-as";
    who: ReactNode;
    stopHref: string;
};
export declare const DEMO_WORDS: {
    readonly title: "Demo with sample data";
    readonly visitor: "This is how the dashboard looks once you connect. The numbers are made up, and nothing you do here is saved.";
    readonly signedIn: "The numbers are made up, and nothing you do here is saved. This is not your real account.";
};
export declare function ModeBanner(props: ModeBannerProps): import("react").JSX.Element;
