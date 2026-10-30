// Mounts the error page specimens: each template's data-mount names the error it is given.
// The route errors are shaped as React Router's (status, statusText, data), with no router.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SiteHeader } from "../site-header/site-header.react.tsx";
import { ErrorPage } from "./error-page.react.tsx";

const routeError = (status: number, statusText: string) => ({ status, statusText, internal: false, data: "" });

const header = (
  <SiteHeader
    logo={{ href: "#home", label: "Phage notes" }}
    sections={["Notes", "Projects", "About"].map((label) => ({ id: label.toLowerCase(), label, href: `#${label.toLowerCase()}` }))}
    skipTo="#main"
    sticky={false}
  />
);

const thrown = new Error("Cannot read properties of undefined (reading 'title')");
thrown.stack = `TypeError: Cannot read properties of undefined (reading 'title')
    at NoteRoute (app/routes/notes.$slug.tsx:41:27)
    at renderWithHooks (react-dom-server.js:1702:18)
    at renderElement (react-dom-server.js:3126:16)`;

const SPECIMENS: Record<string, () => ReactNode> = {
  "not-found": () => <ErrorPage error={routeError(404, "Not Found")} home="#home" siteHeader={header} />,
  gone: () => <ErrorPage error={routeError(410, "Gone")} home="#home" siteHeader={header} />,
  server: () => <ErrorPage error={new Error("D1 timed out")} home="#home" siteHeader={header} />,
  dev: () => <ErrorPage error={thrown} home="#home" siteHeader={header} dev />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
