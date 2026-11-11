// Renders each JSON-LD block as a server sends it (renderToStaticMarkup, put in the page through the
// capsomer policy), hydrates it as the browser does, shows it as parsed, and keeps the server's HTML in
// window.jsonLd so the spec can read what a server sends. Any hydration error goes to window.jsonLd.errors.
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";
import { JsonLd } from "./json-ld.react.tsx";

const NODE = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Spring update",
  author: { "@type": "Person", name: "Alex Rivera", url: "https://example.com/about" },
  datePublished: "2026-04-02",
};

const HOSTILE = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Release notes</script><script>alert(1)</script>",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Example Co & Sons <b>",
    slogan: "Field\u2028notes\u2029",
  },
];

const values = { node: NODE, hostile: HOSTILE } as const;

const errors: string[] = [];
const out: Record<string, unknown> = { errors };
(window as unknown as { jsonLd: Record<string, unknown> }).jsonLd = out;

for (const [key, value] of Object.entries(values)) {
  const host = document.querySelector<HTMLElement>(`[data-mount="${key}"]`);
  const readout = document.getElementById(`read-${key}`);
  if (!host || !readout) continue;
  const server = renderToStaticMarkup(<JsonLd data={value} />);
  out[key] = { value, server };
  setStaticHtml(host, server);
  hydrateRoot(host, <JsonLd data={value} />, {
    onRecoverableError: (e) => errors.push(String((e as Error).message ?? e)),
  });
  readout.textContent = JSON.stringify(
    JSON.parse(host.querySelector("script")?.textContent ?? "null"),
    null,
    2,
  );
}
