export interface AnchorBarProps {
    sections?: Array<{
        id: string;
        label: string;
    }>;
    always?: boolean;
    label?: string;
    orientation?: "horizontal" | "vertical";
}
export declare function AnchorBar({ sections, always, label, orientation, }: AnchorBarProps): import("react").JSX.Element;
