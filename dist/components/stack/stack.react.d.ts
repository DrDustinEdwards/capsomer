import { type ElementType } from "react";
import type { As } from "../text/text.react.tsx";
interface StackOwn {
    gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    className?: string;
}
export type StackProps<T extends ElementType = "div"> = As<T, StackOwn>;
export declare function Stack<T extends ElementType = "div">({ gap, as, className, ...rest }: StackProps<T>): import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
export {};
