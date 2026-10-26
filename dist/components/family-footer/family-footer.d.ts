/** The family's home: every path below is on it. */
export declare const FAMILY_ORIGIN = "https://dustinedwards.info";
export interface FamilyLink {
    to: string;
    label: string;
    /** Another site: never prefixed with the family's origin. */
    external?: boolean;
    /** The owner's own profiles, marked rel="me". */
    me?: boolean;
    /** A prose page that can be a draft: listed only while its path is published. */
    page?: boolean;
}
export interface SocialLink extends FamilyLink {
    mark: "germomics" | "x";
}
export interface WorkspaceLink extends FamilyLink {
    icon: "lamp" | "gear" | "capsid" | "flask";
    /** The accessible name: the visible word first, so speech input still works. */
    name: string;
    hover?: string;
}
/** The Germomics podcast and its X account. Not the owner's own profiles, so not rel="me". */
export declare const SOCIAL_LINKS: SocialLink[];
/** Scholar, PubMed, ORCID, then the posts' feed. */
export declare const PROFILE_LINKS: FamilyLink[];
export declare const WORKSPACE_HEADING = "Workspace";
/** The logins, in Dustin's order: Admin, Portal, Carrel, Lab. Each one's own sign-in keeps it private. */
export declare const WORKSPACE_LINKS: WorkspaceLink[];
export declare const SITE_HEADING = "Site";
/** The Site group: a `page` link only while `published` names its path, every one when it is left out. */
export declare function siteLinks(published?: readonly string[]): FamilyLink[];
/** Every link the footer draws, in page order. */
export declare function familyLinks(published?: readonly string[]): FamilyLink[];
export interface FamilyFooterOptions {
    /** Where the family's paths point: "" on dustinedwards.info itself, its full origin elsewhere (the default). */
    origin?: string;
    /** The published prose pages, so a draft's link waits; left out, every page link shows. */
    published?: readonly string[];
    /** The copyright's last year; this year when left out. */
    year?: number;
}
/**
 * The footer as HTML: plain string building, so a server, a React page or a static build writes the
 * same markup. Its band is the family's `--on`, so each site's own color draws it.
 */
export declare function familyFooterHtml({ origin, published, year }?: FamilyFooterOptions): string;
