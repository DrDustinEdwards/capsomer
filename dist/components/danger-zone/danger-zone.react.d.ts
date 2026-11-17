import { type ReactNode } from "react";
export interface DangerZoneProps {
    title?: ReactNode;
    note?: ReactNode;
    children: ReactNode;
}
export declare function DangerZone({ title, note, children }: DangerZoneProps): import("react").JSX.Element;
