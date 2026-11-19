export interface RangeSliderProps {
    label: string;
    min: number;
    max: number;
    low: number;
    high: number;
    step: number;
    names: [string, string];
    handleLabels?: [string, string];
    format?: (value: number, which: "low" | "high") => string;
    onCommit?: (low: number, high: number) => void;
    className?: string;
}
export declare function RangeSlider({ label, min, max, low, high, step, names, handleLabels, format, onCommit, className, }: RangeSliderProps): import("react").JSX.Element;
