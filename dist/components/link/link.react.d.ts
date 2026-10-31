import { type ComponentProps, type ReactNode } from "react";
import { Link as RouterLink, NavLink as RouterNavLink } from "react-router";
export declare function LinkPrefetch({ exclude, children }: {
    exclude: readonly string[];
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function Link(props: ComponentProps<typeof RouterLink>): import("react").JSX.Element;
export declare function NavLink(props: ComponentProps<typeof RouterNavLink>): import("react").JSX.Element;
