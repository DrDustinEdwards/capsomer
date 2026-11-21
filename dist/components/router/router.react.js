import { jsx as _jsx } from "react/jsx-runtime";
import { Form, useFetcher, useNavigate } from "react-router";
import { ConfirmModal, } from "../confirm-dialog/confirm-dialog.react.js";
import { onlyParamsChanged } from "./router.js";
export { onlyParamsChanged };
/** A part's `renderForm` as the router's Form: the post is a client navigation, and works as a
 * plain form before the script runs. `<ConfirmPage renderForm={routerRenderForm} />`. */
export function routerRenderForm(props) {
    return _jsx(Form, { ...props });
}
/** Capsomer's ConfirmModal on the router: its form is the router's Form and Cancel is a client
 * navigation to `cancelHref` that keeps the scroll position. Opened by the server's answer, so the
 * second step exists without script too. */
export function RouterConfirmModal({ onCancel, ...props }) {
    const navigate = useNavigate();
    return (_jsx(ConfirmModal, { ...props, onCancel: onCancel ?? (() => void navigate(props.cancelHref, { preventScrollReset: true })), renderForm: routerRenderForm }));
}
/** A row's own fetcher, as a part's `useRowForm`: `<NeedsList useRowForm={useRouterRowForm} />`.
 * Each row calls it once, so each row has its own fetcher. */
export function useRouterRowForm() {
    const fetcher = useFetcher();
    // fetcher.Form keeps its identity for the fetcher's life, so the row's form is never remounted.
    return { Form: fetcher.Form, pending: fetcher.state !== "idle" };
}
/** A route's `shouldRevalidate` that skips its loader when only the named display parameters
 * changed (onlyParamsChanged): `export const shouldRevalidate = revalidateUnlessOnly(["view",
 * "group", "size"], { view: "grid" })`. */
export function revalidateUnlessOnly(display, defaults = {}) {
    return ({ currentUrl, nextUrl, defaultShouldRevalidate }) => onlyParamsChanged(currentUrl, nextUrl, display, defaults) ? false : defaultShouldRevalidate;
}
