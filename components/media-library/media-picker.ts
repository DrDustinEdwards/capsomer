// The two fetches every media picker made by hand: one view of a site's media as JSON (the same
// MediaData the library page renders), and one image uploaded with what the person said about it.
// Both resolve or reject with an Error whose message says why, so the caller shows it as it is.
import type { MediaData } from "../content/content.ts";
import { ask, getAnswer } from "../data/data.ts";
import { errorText } from "../dialog/dialog.ts";

// The library page's own address for a JSON endpoint: "/projects/7/media/api" is the endpoint of
// "/projects/7/media". Its links and its search form point there; the picker loads them in place.
export const libraryOf = (endpoint: string): string => endpoint.replace(/\/api\/?$/, "");

// One view of the library (`query` is the page's own "?q=...&tag=..."), as MediaData: data's
// getAnswer read with ask, so a refusal rejects with the site's own words.
export const loadMediaView = (endpoint: string, query = ""): Promise<MediaData> =>
  ask(() => getAnswer<MediaData>(`${endpoint}${query}`));

export interface UploadedImage {
  // What the content stores: the site's own address for the file (/media/<key>).
  url: string;
  // Where this page loads it from, when the editor is on another host than the site.
  src: string;
}

// One image to the media endpoint, with its alt text or marked decorative: site-api 0.19 and later
// refuse an upload with neither and check the alt itself, so the site's refusal is the error.
export async function uploadImage(
  endpoint: string,
  file: File,
  image: { alt: string; decorative: boolean },
  signal?: AbortSignal,
): Promise<UploadedImage> {
  let response: Response;
  try {
    const form = new FormData();
    form.set("file", file);
    if (image.decorative) form.set("decorative", "yes");
    else form.set("alt", image.alt);
    response = await fetch(endpoint, { method: "POST", body: form, signal });
  } catch (thrown) {
    throw new Error(`Upload failed: ${errorText(thrown)}`);
  }
  const body = (await response.json().catch(() => ({}))) as {
    url?: string;
    src?: string;
    error?: string;
  };
  if (!response.ok || !body.url)
    throw new Error(body.error ?? `Upload failed (${response.status}).`);
  return { url: body.url, src: body.src ?? body.url };
}
