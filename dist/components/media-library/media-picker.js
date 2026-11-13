// The library page's own address for a JSON endpoint: "/projects/7/media/api" is the endpoint of
// "/projects/7/media". Its links and its search form point there; the picker loads them in place.
export const libraryOf = (endpoint) => endpoint.replace(/\/api\/?$/, "");
// One view of the library (`query` is the page's own "?q=...&tag=..."), as MediaData.
export async function loadMediaView(endpoint, query = "", signal) {
    let response;
    try {
        response = await fetch(`${endpoint}${query}`, {
            headers: { accept: "application/json" },
            signal,
        });
    }
    catch (thrown) {
        throw new Error(thrown instanceof Error ? thrown.message : String(thrown));
    }
    const body = (await response.json().catch(() => null));
    if (response.ok && body && "rows" in body)
        return body;
    throw new Error((body && body.error) || `The library answered ${response.status}.`);
}
// One image to the media endpoint, with its alt text or marked decorative: site-api 0.19 and later
// refuse an upload with neither and check the alt itself, so the site's refusal is the error.
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
        throw new Error(`Upload failed: ${thrown instanceof Error ? thrown.message : String(thrown)}`);
    }
    const body = (await response.json().catch(() => ({})));
    if (!response.ok || !body.url)
        throw new Error(body.error ?? `Upload failed (${response.status}).`);
    return { url: body.url, src: body.src ?? body.url };
}
