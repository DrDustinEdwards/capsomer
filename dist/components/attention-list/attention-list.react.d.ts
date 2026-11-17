import { type ReactNode } from "react";
import { type RowForm, type RowLinkProps } from "../row-list/row-list.react.tsx";
import { type Need, type AttentionGroupInfo, type AttentionItem } from "./attention-list.ts";
export type { AttentionGroupInfo, AttentionItem, AttentionTone, Inbox, InboxApp, InboxItem, InboxSeverity, Need, NeedUrgency, } from "./attention-list.ts";
export type { RowForm };
export type AttentionLinkProps = RowLinkProps;
export interface AttentionListProps {
    items: AttentionItem[];
    title?: string;
    read?: ReactNode;
    reading?: boolean;
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
export interface NeedLinkProps extends RowLinkProps {
    className?: string;
    "data-variant"?: string;
}
export interface NeedsListProps<G extends string = string> {
    needs: Need<G>[];
    show: "all" | "later" | G;
    label?: string;
    zone: string;
    renderLink?: (props: NeedLinkProps) => ReactNode;
    useRowForm?: () => RowForm;
    onBack?: (need: Need<G>) => void;
    searchKey?: string;
    emptyText?: ReactNode;
    emptyLaterText?: ReactNode;
    primary?: boolean;
}
export declare function NeedsList<G extends string = string>({ needs, show, label, zone, renderLink, useRowForm, onBack, searchKey, emptyText, emptyLaterText, primary, }: NeedsListProps<G>): import("react").JSX.Element;
