import type { ReactNode } from "react";
export interface PriceCardProps {
    name: ReactNode;
    price: ReactNode;
    unit?: ReactNode;
    label?: ReactNode;
    text?: ReactNode;
    points?: ReactNode[];
    action?: ReactNode;
    flag?: ReactNode;
    featured?: boolean;
    id?: string;
    headingLevel?: "h2" | "h3" | "h4";
}
export declare function PriceCard({ name, price, unit, label, text, points, action, flag, featured, id, headingLevel: H, }: PriceCardProps): import("react").JSX.Element;
export declare function PriceGrid({ children, label }: {
    children: ReactNode;
    label?: string;
}): import("react").JSX.Element;
export interface PlanOption {
    value: string;
    name: ReactNode;
    price?: ReactNode;
    disabled?: boolean;
}
export interface PlanChoiceProps {
    name: string;
    legend: ReactNode;
    options: PlanOption[];
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
}
export declare function PlanChoice({ name, legend, options, defaultValue, value, onChange, required, }: PlanChoiceProps): import("react").JSX.Element;
