import { type ReactNode } from "react";
import { type RowLinkProps } from "../row-list/row-list.react.tsx";
import { type AttentionGroupInfo, type AttentionItem } from "./attention-list.ts";
export type { AttentionGroupInfo, AttentionItem, AttentionTone } from "./attention-list.ts";
export type AttentionLinkProps = RowLinkProps;
export interface AttentionListProps {
    items: AttentionItem[];
    title?: string;
    read?: ReactNode;
    headingLevel?: 2 | 3;
    clearText?: string;
    noticesDetail?: string;
    groups?: Record<string, AttentionGroupInfo>;
    problemRows?: number;
    groupRows?: number;
    primary?: boolean;
    renderLink?: (props: RowLinkProps) => ReactNode;
}
export declare function AttentionList(props: AttentionListProps): import("react").JSX.Element;
