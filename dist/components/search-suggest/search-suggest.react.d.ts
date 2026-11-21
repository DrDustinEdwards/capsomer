import { type ComponentProps } from "react";
import { SearchField } from "../field/field.react.tsx";
import { type SuggestOptions } from "./search-suggest.ts";
export type { Suggestion, SuggestOptions } from "./search-suggest.ts";
export type SearchSuggestProps = Omit<ComponentProps<typeof SearchField>, "value" | "onChange" | "action"> & Pick<SuggestOptions, "suggest" | "go" | "search" | "delay" | "min"> & {
    action: string;
    defaultValue?: string;
    rootClassName?: string;
};
export declare function SearchSuggest({ suggest, go, search, delay, min, defaultValue, rootClassName, ...field }: SearchSuggestProps): import("react").JSX.Element;
