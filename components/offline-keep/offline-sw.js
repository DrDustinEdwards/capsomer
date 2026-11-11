// Capsomer's offline worker (offline-keep). It is registered only when a reader presses "Keep on
// this device", and it caches nothing on its own: the page stores itself and the files it uses in
// the store named by this worker's address (?cache=, default "kept-v1"). The worker answers from
// that store only when the network fails, so online the site behaves exactly as it does without
// it, and a page nobody kept is never stored. A plain script, not a module; a site serves it from
// the scope it registers (capsomer/offline-sw.js; offline-keep.md says how).

const KEPT = new URL(self.location.href).searchParams.get("cache") || "kept-v1";
const PREFIX = KEPT.replace(/v\d+$/, "");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // A later version names a new store; the old one goes with the worker that wrote it.
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => PREFIX && name.startsWith(PREFIX) && name !== KEPT)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// A page, or a file a page uses: what a kept page needs offline. Everything else passes by.
const SUBRESOURCES = new Set(["style", "script", "font", "image"]);

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const page = request.mode === "navigate";
  if (!page && !SUBRESOURCES.has(request.destination)) return;
  event.respondWith(networkFirst(request, page));
});

// The network's answer when there is one, else the kept copy. A kept page fetched online is stored
// again, so the copy on the device follows the page; a page that was never kept is left alone.
async function networkFirst(request, page) {
  const cache = await caches.open(KEPT);
  // A page is kept by its address alone (the same recipe at another serving size is still the kept
  // page), and whatever the request's headers: a page that answers `Vary: Accept` is stored under
  // its bare address with no Accept, and a navigation sends text/html, so a match that honored
  // Vary would never find it offline.
  const options = page ? { ignoreSearch: true, ignoreVary: true } : undefined;
  try {
    const response = await fetch(request);
    if (
      page &&
      response.ok &&
      !new URL(request.url).search &&
      (await cache.match(request, options))
    ) {
      await cache.put(new URL(request.url).pathname, response.clone());
    }
    return response;
  } catch (error) {
    const kept = await cache.match(request, options);
    if (kept) return kept;
    throw error;
  }
}
