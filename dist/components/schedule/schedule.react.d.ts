import type { ReactNode } from "react";
import { type ScheduleDay, type ScheduleSlot } from "./schedule.ts";
type Level = 2 | 3 | 4;
export interface ScheduleLinkProps {
    href: string;
    className: string;
    "aria-current"?: "page";
    children: ReactNode;
}
export interface ScheduleDayNavProps {
    days: readonly string[];
    current: string | null;
    hrefFor: (key: string) => string;
    label?: string;
    noDate?: string;
    year?: boolean;
    children?: ReactNode;
    renderLink?: (props: ScheduleLinkProps) => ReactNode;
}
export declare function ScheduleDayNav({ days, current, hrefFor, label, noDate, year, children, renderLink, }: ScheduleDayNavProps): import("react").JSX.Element | null;
export interface ScheduleProps<T> {
    days: readonly ScheduleDay<T>[];
    zone?: string;
    renderItem: (item: T, level: Level | 5) => ReactNode;
    keyOf: (item: T) => string;
    trackOf?: (item: T) => string | null | undefined;
    level?: 2 | 3;
    dayHeadings?: boolean;
    zoneNote?: boolean;
    idPrefix?: string;
    noDate?: string;
    year?: boolean;
    empty?: ReactNode;
    slotFooter?: (slot: ScheduleSlot<T>) => ReactNode;
}
export declare function Schedule<T>({ days, zone, renderItem, keyOf, trackOf, level, dayHeadings, zoneNote, idPrefix, noDate, year, empty, slotFooter, }: ScheduleProps<T>): import("react").JSX.Element;
export interface ScheduleSessionProps {
    title: ReactNode;
    level: Level | 5;
    meta?: ReactNode;
    children?: ReactNode;
}
export declare function ScheduleSession({ title, level, meta, children }: ScheduleSessionProps): import("react").JSX.Element;
export {};
