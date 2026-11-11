import { type SeriesPart } from "./series-nav.ts";
export type { SeriesPart };
export interface SeriesNavProps {
    name: string;
    href: string;
    parts: readonly SeriesPart[];
    current: string;
}
export declare function SeriesNav({ name, href, parts, current }: SeriesNavProps): import("react").JSX.Element | null;
