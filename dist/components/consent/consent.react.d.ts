import type { ComponentType, FormHTMLAttributes, ReactNode } from "react";
export interface PermissionListProps {
    id: string;
    heading: ReactNode;
    items: readonly ReactNode[];
    allowed: boolean;
}
export declare function PermissionList({ id, heading, items, allowed }: PermissionListProps): import("react").JSX.Element;
type FormLike = ComponentType<FormHTMLAttributes<HTMLFormElement> & {
    children?: ReactNode;
}>;
export interface ConsentScreenProps {
    client: string;
    product: string;
    publishedBy?: string | null;
    redirectHost: string;
    redirectWarning?: ReactNode;
    account: {
        name: ReactNode;
        email?: ReactNode;
    };
    can: readonly ReactNode[];
    write?: {
        items: readonly ReactNode[];
        scope?: string;
        defaultChecked?: boolean;
        name?: string;
    };
    error?: ReactNode;
    hidden: Record<string, string | undefined>;
    submitting?: "allow" | "deny" | null;
    brand?: ReactNode;
    footnote?: ReactNode;
    Form?: FormLike;
}
export declare function ConsentScreen({ client, product, publishedBy, redirectHost, redirectWarning, account, can, write, error, hidden, submitting, brand, footnote, Form, }: ConsentScreenProps): import("react").JSX.Element;
export declare function ConsentRefusal({ title, children }: {
    title: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
