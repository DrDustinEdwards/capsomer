// A stand-in for PDF.js on the states page: a three-page document whose pages are drawn as
// numbered sheets, and a refusal for any address that ends "missing.pdf".
export const GlobalWorkerOptions = { workerSrc: "" };
export function getDocument({ url }) {
  if (String(url).endsWith("missing.pdf")) return { promise: Promise.reject(new Error("404")) };
  const page = (n) => ({
    getViewport: ({ scale }) => ({ width: 612 * scale, height: 792 * scale, scale }),
    render: ({ canvasContext: c, viewport }) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, viewport.width, viewport.height);
      c.fillStyle = "#333";
      c.font = `${48 * viewport.scale}px sans-serif`;
      c.fillText(`Page ${n}`, 60 * viewport.scale, 120 * viewport.scale);
      return { promise: Promise.resolve(), cancel() {} };
    },
  });
  return { promise: Promise.resolve({ numPages: 3, getPage: async (n) => page(n) }) };
}
