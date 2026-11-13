import type { ReactNode } from "react";
export interface AppFrameProps {
    children: ReactNode;
    address?: ReactNode;
    variant?: "browser" | "app";
    foot?: ReactNode;
    decorative?: boolean;
    description?: ReactNode;
}
export declare function AppFrame({ children, address, variant, foot, decorative, description, }: AppFrameProps): import("react").JSX.Element;
