import { type ColorLabel } from "./label-color-list.ts";
export type { ColorLabel };
export interface ColorLabelPillProps {
    labels: readonly ColorLabel[];
    value: string;
    unknownNote?: string;
}
export declare function ColorLabelPill({ labels, value, unknownNote, }: ColorLabelPillProps): import("react").JSX.Element | null;
export declare function LabelColorList({ labels, label, }: {
    labels: readonly ColorLabel[];
    label?: string;
}): import("react").JSX.Element;
