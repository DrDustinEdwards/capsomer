import type { ReactNode } from "react";
export interface RouteSplashProps {
    mark: {
        src: string;
        alt: string;
    };
    label?: ReactNode;
}
export declare function RouteSplash({ mark, label }: RouteSplashProps): import("react").JSX.Element;
