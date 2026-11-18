import { type ReactNode } from "react";
import { type SelectOption } from "../select/select.react.tsx";
export interface ScaleControlProps {
    action: string;
    label: string;
    name: string;
    value: number;
    min?: number;
    max?: number;
    step?: number | "any";
    units?: {
        label: string;
        name: string;
        options: SelectOption[];
        value: string;
    };
    submitLabel?: string;
    formLabel?: string;
    children?: ReactNode;
}
export declare function ScaleControl(props: ScaleControlProps): import("react").JSX.Element;
