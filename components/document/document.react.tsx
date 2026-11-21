import type { ReactNode } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";

import { documentAttrs, type DocumentScope } from "./document.ts";

// Which routes hydrate is site-runtime's (./deferred-scripts, with hydrate-on-intent), re-exported for the Layout.
export { documentAttrs, startSite, type DocumentScope, type Starter } from "./document.ts";

export interface DocumentProps extends DocumentScope {
  children: ReactNode;
  lang?: string;
  // More of the head: ThemeColor, the theme script, preloads.
  head?: ReactNode;
  // True on a page whose routes hydrate (site-runtime's routeHydrates(useMatches())): React Router's scripts. Otherwise `script`.
  hydrate?: boolean;
  // The script a page that does not hydrate loads: devkit's `SITE_SCRIPT` from `virtual:islands` ({ src, integrity,
  // crossOrigin }), a bare `src` in `vite dev`. Same-origin and deferred, so it needs no nonce.
  script?: { src: string; integrity?: string; crossOrigin?: "anonymous" };
  // After the content and the scripts: an analytics beacon.
  end?: ReactNode;
}

// A React Router Layout's document. The page is under its family and site layer from the first byte.
export function Document({
  children,
  lang = "en",
  head,
  hydrate = false,
  script,
  end,
  ...scope
}: DocumentProps) {
  return (
    <html lang={lang} {...documentAttrs(scope)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {head}
        <Meta />
        <Links />
        {!hydrate && script ? <script {...script} defer /> : null}
      </head>
      <body>
        {children}
        {hydrate ? (
          <>
            <ScrollRestoration />
            <Scripts />
          </>
        ) : null}
        {end}
      </body>
    </html>
  );
}

export interface SiteScopeProps extends DocumentScope {
  children: ReactNode;
  as?: "div" | "section" | "main" | "article";
  className?: string;
}

// A part of a page under another family or site layer: a specimen, an embedded preview, a sample of another site.
export function SiteScope({ children, as: Tag = "div", className, ...scope }: SiteScopeProps) {
  return (
    <Tag className={className} {...documentAttrs(scope)}>
      {children}
    </Tag>
  );
}
