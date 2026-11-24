import { type ReactNode } from "react";
import { type CalculatorField, type CalculatorRun, type ViewNode } from "./calculator.ts";
export type { CalculatorField, CalculatorResult, CalculatorRun, ViewNode } from "./calculator.ts";
/** A view node as React: the same markup the behavior module builds. */
export declare function renderNode(node: ViewNode | string, key: number): ReactNode;
export interface CalculatorProps {
    id: string;
    action: string;
    fields: CalculatorField[];
    values: Record<string, string>;
    run: CalculatorRun;
    calculator?: string;
    embedded?: boolean;
    submitLabel?: string;
    children?: ReactNode;
}
export declare function Calculator(props: CalculatorProps): import("react").JSX.Element;
