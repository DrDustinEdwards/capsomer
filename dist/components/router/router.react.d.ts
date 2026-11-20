import type { ReactElement } from "react";
import type { RowForm } from "../row-list/row-list.react.tsx";
import { type ShouldRevalidateFunctionArgs } from "react-router";
import { type ConfirmFormProps, type ConfirmModalProps } from "../confirm-dialog/confirm-dialog.react.tsx";
import { onlyParamsChanged } from "./router.ts";
export type { RowForm };
export { onlyParamsChanged };
/** A part's `renderForm` as the router's Form: the post is a client navigation, and works as a
 * plain form before the script runs. `<ConfirmPage renderForm={routerRenderForm} />`. */
export declare function routerRenderForm(props: ConfirmFormProps): ReactElement;
export type RouterConfirmModalProps = Omit<ConfirmModalProps, "renderForm" | "onCancel"> & {
    /** Cancel for a dialog opened from the page's state rather than its address. Without it,
     * Cancel goes to `cancelHref` and keeps the scroll position, since the page behind the dialog
     * is where the reader still is. */
    onCancel?: () => void;
};
/** Capsomer's ConfirmModal on the router: its form is the router's Form and Cancel is a client
 * navigation to `cancelHref` that keeps the scroll position. Opened by the server's answer, so the
 * second step exists without script too. */
export declare function RouterConfirmModal({ onCancel, ...props }: RouterConfirmModalProps): import("react").JSX.Element;
/** A row's own fetcher, as a part's `useRowForm`: `<NeedsList useRowForm={useRouterRowForm} />`.
 * Each row calls it once, so each row has its own fetcher. */
export declare function useRouterRowForm(): RowForm;
/** A route's `shouldRevalidate` that skips its loader when only the named display parameters
 * changed (onlyParamsChanged): `export const shouldRevalidate = revalidateUnlessOnly(["view",
 * "group", "size"], { view: "grid" })`. */
export declare function revalidateUnlessOnly(display: readonly string[], defaults?: Readonly<Record<string, string>>): ({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) => boolean;
