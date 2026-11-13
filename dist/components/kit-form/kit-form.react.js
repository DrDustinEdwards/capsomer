import { jsx as _jsx } from "react/jsx-runtime";
import { useRevalidator, Form } from "react-router";
// The form and the submit React Router apps hand the content-kit lists (posts, media, mentions).
// Moving between views (a tab, the filters, a page) is the router's GET; a post is a plain form, which
// a list sends through `submit` with script and the browser sends to the route's action without.
export const KitForm = ({ method, action, ...props }) => (method ?? "get").toLowerCase() === "get" ? (_jsx(Form, { ...props, action: typeof action === "string" ? action : undefined, method: "get" })) : (_jsx("form", { ...props, action: action, method: method }));
/** With script each intent posts to the screen's JSON endpoint, and the page reads its data again after it. */
export function useKitSubmit(endpoint) {
    const revalidator = useRevalidator();
    return async (form) => {
        const response = await fetch(endpoint, {
            method: "POST",
            body: form,
            headers: { accept: "application/json" },
        });
        const body = (await response.json().catch(() => null));
        if (body && "ok" in body) {
            if (!body.confirm)
                void revalidator.revalidate();
            return body;
        }
        return {
            ok: false,
            message: (body && "error" in body && body.error) || `The server answered ${response.status}.`,
        };
    };
}
