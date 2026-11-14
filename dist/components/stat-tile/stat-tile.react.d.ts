import { type ReactNode } from "react";
export type StatTone = "ok" | "warn" | "crit" | "nodata";
export type StaticTone = StatTone | "accent";
export interface StatTileLinkProps {
    href: string;
    className: string;
    "data-tone"?: StatTone;
    "aria-describedby"?: string;
    children: ReactNode;
}
interface StatTileBase {
    label: string;
    tone?: StatTone;
    word?: string;
    detail?: ReactNode;
    chart?: string;
    chartSummary?: string;
    chartTable?: string;
    href?: string;
    onClick?: () => void;
    renderLink?: (props: StatTileLinkProps) => ReactNode;
}
export type StatTileProps = (StatTileBase & {
    tone?: "ok" | "warn" | "crit";
    figure: ReactNode;
    unit?: ReactNode;
}) | (StatTileBase & {
    tone: "nodata";
    reason: string;
    figure?: never;
    unit?: never;
});
export declare function StatTile(props: StatTileProps): string | number | bigint | boolean | import("react").JSX.Element | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined;
interface StaticStatTileBase {
    label: string;
    tone?: StaticTone;
    size?: "lg";
    icon?: ReactNode;
    delta?: ReactNode;
    figureFirst?: boolean;
    detail?: ReactNode;
}
export type StaticStatTileProps = (StaticStatTileBase & {
    tone?: "ok" | "warn" | "crit" | "accent";
    figure: ReactNode;
    unit?: ReactNode;
}) | (StaticStatTileBase & {
    tone: "nodata";
    reason: string;
    figure?: never;
    unit?: never;
});
export declare function StaticStatTile(props: StaticStatTileProps): import("react").JSX.Element;
export interface StatTilesProps {
    label?: string;
    layout?: "grid";
    children: ReactNode;
}
export declare function StatTiles({ label, layout, children }: StatTilesProps): import("react").JSX.Element;
export {};
