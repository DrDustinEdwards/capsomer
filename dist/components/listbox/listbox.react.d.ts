import { type HTMLAttributes, type ReactNode } from "react";
import { type ListboxMode, type Selection } from "./listbox.ts";
export { emptyText, filterCommands, groupBy, matchesQuery, nextTypeahead, resultsText, step, stepEnabled } from "./listbox.ts";
export type { ListboxMode, Selection } from "./listbox.ts";
export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
    selection?: Selection;
    mode?: ListboxMode;
    variant?: "surface";
    controlled?: boolean;
}
export declare function Listbox({ selection, mode, variant, controlled, className, children, ...rest }: ListboxProps): import("react").JSX.Element;
export interface OptionProps extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "id"> {
    id: string;
    value?: string;
    selected?: boolean;
    active?: boolean;
    disabled?: boolean;
    tone?: "crit";
    keywords?: readonly string[];
    icon?: ReactNode;
    hint?: ReactNode;
    keys?: readonly string[] | ReactNode;
}
export declare function Option({ id, value, selected, active, disabled, tone, keywords, icon, hint, keys, className, children, ...rest }: OptionProps): import("react").JSX.Element;
export interface OptionGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
    label: ReactNode;
}
export declare function OptionGroup({ label, className, children, ...rest }: OptionGroupProps): import("react").JSX.Element;
export declare function ListboxSeparator(): import("react").JSX.Element;
export declare function ListboxEmpty({ children }: {
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function ListboxStatus({ count, filtered }: {
    count: number;
    filtered: boolean;
}): import("react").JSX.Element;
