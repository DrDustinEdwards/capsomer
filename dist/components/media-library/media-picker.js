import { ask, getAnswer } from "../data/data.js";
import { errorText } from "../dialog/dialog.js";
export const libraryOf = (endpoint) => endpoint.replace(/\/api\/?$/, "");
export const loadMediaView = (endpoint, query = "") => ask(() => getAnswer(`${endpoint}${query}`));
// Site-api 0.19 and later refuse an upload with neither alt nor decorative, so the site's refusal is the error.
export async function uploadImage(endpoint, file, image, signal) {
    let response;
    try {
        const form = new FormData();
        form.set("file", file);
        if (image.decorative)
            form.set("decorative", "yes");
        else
            form.set("alt", image.alt);
        response = await fetch(endpoint, { method: "POST", body: form, signal });
    }
    catch (thrown) {
        throw new Error(`Upload failed: ${errorText(thrown)}`);
    }
    const body = (await response.json().catch(() => ({})));
    if (!response.ok || !body.url)
        throw new Error(body.error ?? `Upload failed (${response.status}).`);
    return { url: body.url, src: body.src ?? body.url };
}
