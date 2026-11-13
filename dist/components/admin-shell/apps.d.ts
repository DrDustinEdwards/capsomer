import type { ReactNode } from "react";
export type FamilyAppId = "portal" | "carrel" | "info" | "germomics" | "foxhound" | "foxing" | "capsomer";
export interface FamilyApp {
    id: FamilyAppId;
    label: string;
    href: string;
    logo: ReactNode;
    names?: readonly [site: string, app: string];
    standalone?: boolean;
}
export declare const FAMILY_APPS: readonly FamilyApp[];
export declare const OWNER: {
    readonly name: "Dustin Edwards";
    readonly initials: "DE";
};
export declare const FIRST_PAGE = "Overview";
