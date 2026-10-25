import type { ReactNode } from "react";
export type FamilyAppId = "portal" | "carrel" | "info" | "germomics" | "foxhound" | "foxing" | "capsomer";
export interface FamilyApp {
    id: FamilyAppId;
    label: string;
    href: string;
    logo: ReactNode;
}
export declare const FOXHOUND_MARKS: {
    track: import("react").JSX.Element;
    fox: import("react").JSX.Element;
};
export declare const FAMILY_APPS: readonly FamilyApp[];
export declare const OWNER: {
    readonly name: "Dustin Edwards";
    readonly initials: "DE";
};
export declare const FIRST_PAGE = "Overview";
