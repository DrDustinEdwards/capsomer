import { type ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { type HeaderDoes, type HeaderItem, type HeaderGroup, type SheetPart } from "./site-header-types.ts";
export type { HeaderLink, HeaderDoes, HeaderActionItem, HeaderItem, HeaderGroup, HeaderLogo, HeaderSwitcher, HeaderSection, HeaderExtra, HeaderAccountLink, HeaderAccount, SheetPart, SiteHeaderProps, } from "./site-header-types.ts";
export declare const HeaderHydrates: import("react").Context<boolean>;
export declare function headerItem(item: {
    href?: string;
    current?: boolean;
    label: string;
} & HeaderDoes, children: ReactNode, renderLink: (p: LinkProps) => ReactNode, { onClose, ariaLabel, disabled, }?: {
    onClose?: () => void;
    ariaLabel?: string;
    disabled?: boolean;
}): ReactNode;
export declare const CHEV: import("react").JSX.Element;
export declare const MENU_ICON: import("react").JSX.Element;
export declare const SEARCH_ICON: import("react").JSX.Element;
export declare const PERSON_ICON: import("react").JSX.Element;
export declare const countName: (label: string, count?: number, note?: string) => string;
export declare function TipKeys({ keys }: {
    keys?: string;
}): import("react").JSX.Element | null;
export declare function HeaderTip({ text, keys }: {
    text: string;
    keys?: string;
}): import("react").JSX.Element;
export declare function Disclosure({ id, className, label, name, current, align, size, panelClassName, children, button, }: {
    id: string;
    className: string;
    label?: string;
    name?: string;
    current?: boolean;
    align?: "end";
    size?: "wide";
    panelClassName?: string;
    children: ReactNode;
    button: ReactNode;
}): import("react").JSX.Element;
export declare function GroupList({ groups, renderLink, }: {
    groups: HeaderGroup[];
    renderLink: (p: LinkProps) => ReactNode;
}): import("react").JSX.Element;
export declare function SheetGroup({ label, links, renderLink, onClose, }: {
    label?: string;
    links: HeaderItem[];
    renderLink?: (p: LinkProps) => ReactNode;
    onClose: () => void;
}): import("react").JSX.Element;
export declare const part: (p: SheetPart, close: () => void) => ReactNode;
