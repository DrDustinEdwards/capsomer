import { headerItem, type HeaderAccount, type HeaderExtra, type HeaderGroup, type HeaderLogo, type SiteHeaderProps } from "./site-header-parts.react.tsx";
type RenderLink = NonNullable<SiteHeaderProps["renderLink"]>;
type RowItem = Parameters<typeof headerItem>[0];
export declare function renderExtra(e: HeaderExtra, renderLink: RenderLink): import("react").JSX.Element;
export declare function renderLogo(logo: HeaderLogo, letterhead: boolean, renderLink: RenderLink): import("react").ReactNode;
export declare function accountPanelOf(account: HeaderAccount, panelGroups: HeaderGroup[], signOut: RowItem | undefined, renderLink: RenderLink): string | number | bigint | boolean | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").JSX.Element;
export declare function renderTrail(trail: NonNullable<SiteHeaderProps["trail"]>, renderLink: RenderLink): import("react").JSX.Element;
export declare function signOutRow(account: HeaderAccount): RowItem | undefined;
export {};
