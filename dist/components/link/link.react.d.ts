import { type AnchorHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { Link as RouterLink, NavLink as RouterNavLink } from "react-router";
import { type ButtonLook } from "../button/button-look.ts";
export declare function LinkPrefetch({ exclude, children, }: {
    exclude: readonly string[];
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function Link(props: ComponentProps<typeof RouterLink>): import("react").JSX.Element;
export declare function NavLink(props: ComponentProps<typeof RouterNavLink>): import("react").JSX.Element;
export declare function routerRenderLink({ href, children, ...rest }: {
    href: string;
    children?: ReactNode;
} & Omit<ComponentProps<typeof RouterLink>, "to">): import("react").JSX.Element;
export interface AwayLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "rel" | "target" | "style"> {
    href: string;
    newTab?: boolean;
    sponsored?: boolean;
    children?: ReactNode;
}
export declare function awayRel(sponsored?: boolean): string;
export declare function awayWords(newTab?: boolean): string;
export declare const NEW_TAB_WORDS = " (opens in a new tab)";
export declare function AwayLink({ newTab, sponsored, children, ...rest }: AwayLinkProps): import("react").JSX.Element;
type ButtonLinkLook = ButtonLook & {
    label?: string;
    away?: boolean;
    newTab?: boolean;
    sponsored?: boolean;
};
export type ButtonLinkProps = ButtonLinkLook & ((Omit<ComponentProps<typeof RouterLink>, "style"> & {
    href?: never;
}) | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "style"> & {
    href: string;
    to?: never;
}));
export declare function ButtonLink(props: ButtonLinkProps): import("react").JSX.Element;
export {};
