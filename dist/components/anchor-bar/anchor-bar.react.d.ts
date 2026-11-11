export interface AnchorBarProps {
    sections: Array<{
        id: string;
        label: string;
    }>;
    always?: boolean;
    label?: string;
}
export declare function AnchorBar({ sections, always, label }: AnchorBarProps): import("react").JSX.Element;
