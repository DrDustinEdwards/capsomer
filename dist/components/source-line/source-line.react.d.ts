import type { ReactNode } from "react";
export declare function citation(href: string): string;
export interface SourceLineProps {
    href: string;
    read: ReactNode;
    name?: ReactNode;
}
export declare function SourceLine({ href, read, name }: SourceLineProps): import("react").JSX.Element;
