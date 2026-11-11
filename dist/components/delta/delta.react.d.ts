import { type CompareOptions, type Delta as DeltaValue } from "./delta.ts";
export { compareFigures, deltaText, UNCHANGED_BELOW_PCT, type CompareOptions } from "./delta.ts";
export type { DeltaValue };
export type DeltaProps = {
    delta: DeltaValue;
} | ({
    current: number | null | undefined;
    previous: number | null | undefined;
} & CompareOptions);
export declare function Delta(props: DeltaProps): import("react").JSX.Element | null;
