import type { ReactNode } from "react";
export interface QrProps {
    url: string;
    modules: ReadonlyArray<ReadonlyArray<boolean>>;
    quiet?: number;
    caption?: ReactNode;
    showUrl?: boolean;
    label?: string;
}
export declare function Qr(props: QrProps): import("react").JSX.Element;
