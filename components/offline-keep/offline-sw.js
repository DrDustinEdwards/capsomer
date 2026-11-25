// Capsomer's offline worker (offline-keep). Registered only when a reader presses "Keep on this
// device"; the page stores itself and its files in the store named by this worker's address (?cache=,
// default "kept-v1"). It answers from that store only when the network fails, so online the site is
// unchanged and a page nobody kept is never stored. A plain script, not a module.

const KEPT = new URL(self.location.href).searchParams.get("cache") || "kept-v1";
const PREFIX = KEPT.replace(/v\d+$/, "");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                PREFIX &&
                name !== KEPT &&
                name.startsWith(PREFIX) &&
                /^v\d+$/.test(name.slice(PREFIX.length)),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

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
// again so the copy follows the page; a page never kept is left alone.
async function networkFirst(request, page) {
  const cache = await caches.open(KEPT);
  // A page is kept by its bare address, whatever the request's headers: a page that answers `Vary:
  // Accept` is stored with no Accept, and a navigation sends text/html, so a match honoring Vary
  // would never find it.
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
