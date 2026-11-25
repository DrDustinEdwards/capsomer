// The two fetches every media picker made by hand: one view of a site's media as JSON (MediaData), and one uploaded image.
// Both reject with an Error whose message says why.
import type { MediaData } from "../content/content.ts";
import { ask, getAnswer } from "../data/data.ts";
import { errorText } from "../dialog/dialog.ts";

export const libraryOf = (endpoint: string): string => endpoint.replace(/\/api\/?$/, "");

export const loadMediaView = (endpoint: string, query = ""): Promise<MediaData> =>
  ask(() => getAnswer<MediaData>(`${endpoint}${query}`));

export interface UploadedImage {
  url: string;
  src: string;
}

// Site-api 0.19 and later refuse an upload with neither alt nor decorative, so the site's refusal is the error.
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
