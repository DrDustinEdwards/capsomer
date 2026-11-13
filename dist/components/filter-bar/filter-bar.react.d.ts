import { type ComponentType, type FormEvent, type ReactNode, type Ref } from "react";
export { clearedHref, isFiltered, withParams, type Params } from "./filter-bar.ts";
type FormLike = ComponentType<{
    method?: "get";
    action?: string;
    role?: string;
    "aria-label"?: string;
    className?: string;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
    ref?: Ref<HTMLFormElement>;
    replace?: boolean;
    preventScrollReset?: boolean;
    children?: ReactNode;
}>;
export interface FilterBarProps {
    label: string;
    children: ReactNode;
    count?: ReactNode;
    clearHref?: string | null;
    Form?: FormLike | "form";
    action?: string;
    live?: boolean;
    delay?: number;
    applyLabel?: string;
    applyVariant?: "default" | "primary";
    clearLabel?: string;
    renderLink?: (props: {
        href: string;
        className: string;
        children: ReactNode;
    }) => ReactNode;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
    className?: string;
}
export declare function FilterBar(props: FilterBarProps): import("react").JSX.Element;
