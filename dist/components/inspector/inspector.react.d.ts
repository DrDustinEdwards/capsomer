import { type ReactNode } from "react";
export interface InspectorTab {
    value: string;
    label: string;
    count?: number;
    content: ReactNode;
}
export declare const INSPECTOR_WIDE = "(min-width: 1100px)";
export interface InspectorProps {
    label: string;
    head?: ReactNode;
    tabs: InspectorTab[];
    defaultTab?: string;
    /** The tab asked for by the address (`?tab=checks`): the inspector opens on it, and on a phone
     * opens the sheet, so a link from a list of flags lands on the checks. */
    initialTab?: string | null;
    /** The media query from which the tabs sit beside the text. Match it to the page's own grid. */
    wideQuery?: string;
    className?: string;
}
export declare function Inspector({ label, head, tabs, defaultTab, initialTab, wideQuery, className, }: InspectorProps): import("react").JSX.Element;
