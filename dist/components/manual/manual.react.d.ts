export interface SignTarget {
    href: string;
    title: string;
    label: string;
}
type Ways = SignTarget | readonly SignTarget[] | null | undefined;
export interface SignsProps {
    label: string;
    prev?: Ways;
    next?: Ways;
    className?: string;
}
export declare function Signs({ label, prev, next, className }: SignsProps): import("react").JSX.Element | null;
export {};
