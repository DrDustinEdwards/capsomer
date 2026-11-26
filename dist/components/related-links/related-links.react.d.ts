export interface RelatedItem {
    href: string | null;
    title: string;
    excerpt?: string | null;
    date?: string | number | Date | null;
}
export type RelatedKind = "internal" | "external" | "mentions";
export interface RelatedLinksProps {
    title: string;
    kind: RelatedKind;
    items: readonly RelatedItem[];
}
export declare function RelatedLinks({ title, kind, items }: RelatedLinksProps): import("react").JSX.Element | null;
