export type ShareTarget = "x" | "linkedin" | "bluesky" | "facebook" | "email";
export declare const SHARE_NAMES: Record<ShareTarget, string>;
export declare function shareHref(target: ShareTarget, url: string, title: string): string;
