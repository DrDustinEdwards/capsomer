// The React Router bindings every Capsomer React part needs, in one place, so no site writes its own
// glue: the router's Form for a part that takes `renderForm`, the confirm dialog with the router's
// navigation, a fetcher form for a row action that hides its row while it is sent, and a
// `shouldRevalidate` that skips the loader when only a display parameter changed. The router's Link
// for `renderLink` is `routerRenderLink` in capsomer/react/link.

import type { ReactElement } from "react";
import type { RowForm } from "../row-list/row-list.react.tsx";
import { Form, useFetcher, useNavigate, type ShouldRevalidateFunctionArgs } from "react-router";
import {
  ConfirmModal,
  type ConfirmFormProps,
  type ConfirmModalProps,
} from "../confirm-dialog/confirm-dialog.react.tsx";
import { onlyParamsChanged } from "./router.ts";

export type { RowForm };

export { onlyParamsChanged };

/** A part's `renderForm` as the router's Form: the post is a client navigation, and works as a
 * plain form before the script runs. `<ConfirmPage renderForm={routerRenderForm} />`. */
export function routerRenderForm(props: ConfirmFormProps): ReactElement {
  return <Form {...props} />;
}

export type RouterConfirmModalProps = Omit<ConfirmModalProps, "renderForm" | "onCancel"> & {
  /** Cancel for a dialog opened from the page's state rather than its address. Without it,
   * Cancel goes to `cancelHref` and keeps the scroll position, since the page behind the dialog
   * is where the reader still is. */
  onCancel?: () => void;
};

/** Capsomer's ConfirmModal on the router: its form is the router's Form and Cancel is a client
 * navigation to `cancelHref` that keeps the scroll position. Opened by the server's answer, so the
 * second step exists without script too. */
export function RouterConfirmModal({ onCancel, ...props }: RouterConfirmModalProps) {
  const navigate = useNavigate();
  return (
    <ConfirmModal
      {...props}
      onCancel={onCancel ?? (() => void navigate(props.cancelHref, { preventScrollReset: true }))}
      renderForm={routerRenderForm}
    />
  );
}

/** A row's own fetcher, as a part's `useRowForm`: `<NeedsList useRowForm={useRouterRowForm} />`.
 * Each row calls it once, so each row has its own fetcher. */
export function useRouterRowForm(): RowForm {
  const fetcher = useFetcher();
  // fetcher.Form keeps its identity for the fetcher's life, so the row's form is never remounted.
  return { Form: fetcher.Form as RowForm["Form"], pending: fetcher.state !== "idle" };
}

/** A route's `shouldRevalidate` that skips its loader when only the named display parameters
 * changed (onlyParamsChanged): `export const shouldRevalidate = revalidateUnlessOnly(["view",
 * "group", "size"], { view: "grid" })`. */
export function revalidateUnlessOnly(
  display: readonly string[],
  defaults: Readonly<Record<string, string>> = {},
) {
  return ({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) =>
    onlyParamsChanged(currentUrl, nextUrl, display, defaults) ? false : defaultShouldRevalidate;
}
