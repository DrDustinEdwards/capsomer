// The PDF viewer's behavior: the current page drawn on a canvas by PDF.js, page-through, a page
// indicator, zoom, and the keyboard on the page. PDF.js is never bundled: the site hosts its
// build (pdfjs-dist's build files and its wasm, iccs, standard_fonts and cmaps folders) under one
// folder, named by data-pdfjs (default /pdfjs/), and this module imports it from there at
// runtime, in the browser only. When loading fails the page is replaced by a link to the PDF.

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 3;
export const SCALE_STEP = 0.25;
export const DEFAULT_SCALE = 1.2;

// The shape of PDF.js this module uses, so the package needs no pdfjs-dist types.
interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: unknown;
  }): {
    promise: Promise<void>;
    cancel(): void;
  };
}
interface PdfDoc {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}
interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(o: Record<string, unknown>): { promise: Promise<PdfDoc> };
}

// The next page and scale, kept inside the document and the zoom's range.
export function clampView(
  to: { page?: number; scale?: number },
  at: { page: number; scale: number; pages: number },
): { page: number; scale: number } {
  const page = Math.min(Math.max(1, to.page ?? at.page), at.pages || 1);
  const scale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, Math.round((to.scale ?? at.scale) * 100) / 100),
  );
  return { page, scale };
}

const started = new WeakSet<HTMLElement>();

export function start(root: HTMLElement): () => void {
  if (started.has(root)) return () => undefined;
  started.add(root);
  const url = root.dataset.src ?? "";
  // Against the page, not this module: a relative folder means the page's.
  const base = new URL((root.dataset.pdfjs ?? "/pdfjs/").replace(/\/?$/, "/"), document.baseURI)
    .href;
  const q = <T extends Element>(s: string) => root.querySelector<T>(s);
  const prev = q<HTMLButtonElement>("[data-pdf='prev']");
  const next = q<HTMLButtonElement>("[data-pdf='next']");
  const zoomOut = q<HTMLButtonElement>("[data-pdf='zoom-out']");
  const zoomIn = q<HTMLButtonElement>("[data-pdf='zoom-in']");
  const status = q<HTMLElement>("[data-pdf='status']");
  const zoom = q<HTMLElement>("[data-pdf='zoom']");
  const view = q<HTMLElement>(".cap-pdf-page");
  const canvas = q<HTMLCanvasElement>(".cap-pdf-page canvas");
  if (!url || !prev || !next || !zoomOut || !zoomIn || !status || !zoom || !view || !canvas)
    return () => undefined;

  let doc: PdfDoc | null = null;
  let page = 1;
  let scale = DEFAULT_SCALE;
  let task: { cancel(): void } | null = null;
  let gone = false;

  const sync = () => {
    const ready = doc !== null;
    const pages = doc?.numPages ?? 0;
    prev.disabled = !ready || page <= 1;
    next.disabled = !ready || page >= pages;
    zoomOut.disabled = !ready || scale <= MIN_SCALE;
    zoomIn.disabled = !ready || scale >= MAX_SCALE;
    status.textContent = ready ? `Page ${page} of ${pages}` : "Loading";
    zoom.textContent = `${Math.round(scale * 100)}%`;
  };

  const render = async () => {
    if (!doc) return;
    try {
      const p = await doc.getPage(page);
      const viewport = p.getViewport({ scale });
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.dataset.sized = "";
      task?.cancel();
      const t = p.render({ canvas, canvasContext: context, viewport });
      task = t;
      await t.promise;
    } catch {
      // A canceled render rejects; nothing to undo.
    }
  };

  const go = (to: { page?: number; scale?: number }) => {
    if (!doc) return;
    const v = clampView(to, { page, scale, pages: doc.numPages });
    if (v.page === page && v.scale === scale) return;
    page = v.page;
    scale = v.scale;
    sync();
    void render();
  };

  const fail = () => {
    const box = document.createElement("div");
    box.className = "cap-pdf-error";
    const p = document.createElement("p");
    p.textContent = "The viewer could not load this PDF.";
    box.appendChild(p);
    const link = root.querySelector(".cap-pdf-fallback");
    if (link) box.appendChild(link.cloneNode(true));
    status.textContent = "Not loaded";
    canvas.replaceWith(box);
  };

  const keys: Record<string, () => void> = {
    ArrowLeft: () => go({ page: page - 1 }),
    PageUp: () => go({ page: page - 1 }),
    ArrowRight: () => go({ page: page + 1 }),
    PageDown: () => go({ page: page + 1 }),
    Home: () => go({ page: 1 }),
    End: () => go({ page: doc?.numPages ?? 1 }),
    "+": () => go({ scale: scale + SCALE_STEP }),
    "=": () => go({ scale: scale + SCALE_STEP }),
    "-": () => go({ scale: scale - SCALE_STEP }),
  };
  const onKey = (e: KeyboardEvent) => {
    const run = keys[e.key];
    if (!run || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    run();
  };
  const handlers: Array<[HTMLElement, string, EventListener]> = [
    [prev, "click", () => go({ page: page - 1 })],
    [next, "click", () => go({ page: page + 1 })],
    [zoomOut, "click", () => go({ scale: scale - SCALE_STEP })],
    [zoomIn, "click", () => go({ scale: scale + SCALE_STEP })],
    [view, "keydown", onKey as EventListener],
  ];
  for (const [el, type, f] of handlers) el.addEventListener(type, f);
  root.dataset.capReady = "";

  void (async () => {
    try {
      const pdfjs = (await import(/* @vite-ignore */ `${base}pdf.min.mjs`)) as PdfJs;
      pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
      const loaded = await pdfjs.getDocument({
        url,
        // Without the wasm decoders, scanned (JBIG2, JPEG 2000) pages draw blank.
        wasmUrl: `${base}wasm/`,
        iccUrl: `${base}iccs/`,
        standardFontDataUrl: `${base}standard_fonts/`,
        cMapUrl: `${base}cmaps/`,
        cMapPacked: true,
      }).promise;
      if (gone) return;
      doc = loaded;
      sync();
      await render();
    } catch {
      if (!gone) fail();
    }
  })();

  return () => {
    gone = true;
    task?.cancel();
    for (const [el, type, f] of handlers) el.removeEventListener(type, f);
    started.delete(root);
    delete root.dataset.capReady;
  };
}

export function enhance(root: ParentNode = document): () => void {
  const stops = [
    ...root.querySelectorAll<HTMLElement>('[data-cap="pdf-viewer"]:not([data-cap-ready])'),
  ].map(start);
  return () => stops.forEach((f) => f());
}
