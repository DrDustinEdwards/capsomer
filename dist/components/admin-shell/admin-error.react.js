import { jsx as _jsx } from "react/jsx-runtime";
import { ErrorPage, errorWords } from "../error-page/error-page.react.js";
import { FIRST_PAGE } from "./apps.js";
function refusalText(error) {
    const data = error?.data;
    return typeof data === "string" && data.trim() ? data : undefined;
}
export function AdminErrorView({ error, home, homeLabel, dev }) {
    const words = errorWords(error);
    return (_jsx(ErrorPage, { error: error, home: home, homeLabel: homeLabel ?? `Go to the ${FIRST_PAGE}`, title: words.status === 403 ? "No access" : undefined, text: refusalText(error) ?? (words.status >= 500 ? "Nothing you wrote is lost." : undefined), dev: dev }));
}
