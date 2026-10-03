// Mounts the specimen: the Catalog wrapper over the fixture collection. A real site renders this on its server;
// the specimen has no server, so it renders in the page, and answers the behaviour's fetches itself (the page's own
// address with a query string) with the HTML a server would have sent.
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Catalog } from "./catalog.react.tsx";
import { parseCatalogParams, queryCatalog } from "./catalog-core.ts";
import { PROTOCOLS, protocolCatalog as def } from "./fixture.ts";

function Demo({ id, query }: { id: string; query: string }) {
  const result = queryCatalog(def, PROTOCOLS, parseCatalogParams(def, query));
  return (
    <Catalog
      definition={{ ...def, id }}
      result={result}
      labelledBy={id === "wide" ? "s-wide" : "s-narrow"}
      title={(p) => <a className="cap-table-open" href={`#${p.id}`}>{p.title}</a>}
      cells={{ size: (p) => (p.size === null ? <span className="cap-sr-only">No data</span> : String(p.size)) }}
      actions={<a className="cap-btn" href="#download">Download CSV</a>}
    />
  );
}

const original = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
  if (url.pathname !== def.basePath) return original(input, init);
  // The behaviour asks for the catalog whose form it holds; both demos answer.
  const html = ["wide", "narrow"].map((id) => renderToString(<Demo id={id} query={url.search} />)).join("");
  return Promise.resolve(new Response(`<!doctype html><body>${html}</body>`, { headers: { "content-type": "text/html" } }));
};

for (const [id, root] of [["wide", "catalog-wide"], ["narrow", "catalog-narrow"]] as const) {
  const el = document.getElementById(root);
  if (el) createRoot(el).render(<Demo id={id} query={location.search} />);
}
