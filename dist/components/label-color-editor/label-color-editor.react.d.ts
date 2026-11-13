import { type ColorLabel } from "../label-color-list/label-color-list.ts";
export interface LabelColorEditorProps {
    labels: readonly ColorLabel[];
    spare?: number;
    max?: number;
    nameLabel?: (n: number) => string;
    colorLabel?: (n: number) => string;
}
export declare function LabelColorEditor({ labels, spare, max, nameLabel, colorLabel, }: LabelColorEditorProps): import("react").JSX.Element;
