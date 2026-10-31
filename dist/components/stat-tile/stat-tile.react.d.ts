import { type DataTable } from "enarratio";
import { type ReactNode } from "react";
export type StatTone = "ok" | "warn" | "crit" | "nodata";
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
    chartTable?: DataTable;
    chartTableLabel?: string;
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
export declare function StatTile(props: StatTileProps): import("react").JSX.Element;
export interface StatTilesProps {
    label?: string;
    children: ReactNode;
}
export declare function StatTiles({ label, children }: StatTilesProps): import("react").JSX.Element;
export {};
