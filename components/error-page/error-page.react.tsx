import type { ReactNode } from "react";
import { Empty } from "../empty/empty.react.tsx";

// The page a React Router root ErrorBoundary renders: the failed Empty, in plain words for 404, 410
// and everything else, with the site's own header kept so the skip link and landmarks stay. Eight
// sites each wrote this in root.tsx; dustinedwards.info's ErrorPage and Foxhound's ErrorView are
// the two it is drawn from. No react-router import: a route error is read by its shape, so the
// package keeps no router dependency.

export interface ErrorWords {
  // The HTTP status the page stands for: the route error's own, else 500.
  status: number;
  title: string;
  text: string;
}

// A route error response (a thrown Response, data() or a 404 no route matched) has a numeric
// status and a string statusText; that is all isRouteErrorResponse itself checks besides the
// router's private flag.
function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const { status, statusText } = error as { status?: unknown; statusText?: unknown };
  return typeof status === "number" && typeof statusText === "string" ? status : null;
}

// The statusText site-runtime's databaseDown(error) gives the 503 a loader throws when D1 is down
// or reset for a moment (DATABASE_DOWN_STATUS_TEXT in @dustinedwards/site-runtime/health).
const DATABASE_DOWN = /database/i;

/** What the page says for an error: its status, a title and one plain sentence. */
export function errorWords(error: unknown): ErrorWords {
  const status = statusOf(error);
  if (status === 404) return { status, title: "Page not found", text: "There is nothing at this address. Check it for a typo, or start again from the home page." };
  if (status === 410) return { status, title: "This page is gone", text: "It was taken down on purpose and is not coming back." };
  if (status !== null && status < 500) return { status, title: "This page cannot be shown", text: `The request was refused (${status}). Start again from the home page.` };
  if (status === 503) {
    const { statusText } = error as { statusText: string };
    if (DATABASE_DOWN.test(statusText)) return { status, title: "The site's data is unavailable", text: "Its database is not answering for the moment. Nothing you did caused this; try again in a few minutes." };
    return { status, title: "This page is unavailable for now", text: "The site is busy or being updated. Try again in a few minutes." };
  }
  return { status: status ?? 500, title: "Something went wrong", text: "The page could not be shown. It is not something you did; try again in a moment." };
}

/** The title for the root `meta` on the error path: "Page not found | Site name". */
export function errorTitle(error: unknown, siteName: string): string {
  return `${errorWords(error).title} | ${siteName}`;
}

export interface ErrorPageProps {
  // The ErrorBoundary's error (Route.ErrorBoundaryProps["error"]).
  error: unknown;
  // The home page's address, for the way out.
  home: string;
  // The site's header, so its skip link and banner landmark stay on the error page. It must read no
  // loader data: on the error path there is none.
  siteHeader?: ReactNode;
  // The site's footer (the contentinfo landmark), under the same condition.
  siteFooter?: ReactNode;
  // Under the message, inside main: a search form, the site's most read pages.
  children?: ReactNode;
  // Development only: the thrown error's message and stack are shown. Pass import.meta.env.DEV; off
  // by default, so production never shows a stack.
  dev?: boolean;
  // The main region's id, the skip link's target. Default "main".
  mainId?: string;
  // A class for main beside cap-error-page, for the site's own page frame.
  className?: string;
  // The site's own words, in place of errorWords' for this error: a site whose copy is edited
  // content (julieedwards.info's 404 is Carrel copy in D1) passes it here.
  title?: string;
  text?: string;
  // The home link's words. Default "Go to the home page".
  homeLabel?: string;
  // Render the region as a div when the site's Layout already wraps every page in its main, so the
  // page keeps one main. Default "main".
  as?: "main" | "div";
}

export function ErrorPage({
  error,
  home,
  siteHeader,
  siteFooter,
  children,
  dev = false,
  mainId = "main",
  className,
  title,
  text,
  homeLabel = "Go to the home page",
  as: Region = "main",
}: ErrorPageProps) {
  const found = errorWords(error);
  const words = { status: found.status, title: title ?? found.title, text: text ?? found.text };
  const thrown = dev && error instanceof Error ? error : null;
  const server = words.status >= 500;
  const action = (
    <>
      {server ? (
        // An empty href is this address: a reload that works before the page hydrates, and with no script.
        <a className="cap-btn" data-variant="primary" href="">
          Try again
        </a>
      ) : null}
      <a className="cap-btn" data-variant={server ? undefined : "primary"} href={home}>
        {homeLabel}
      </a>
    </>
  );
  return (
    <>
      {/* React hoists it into head: an error page is never indexed. */}
      <meta name="robots" content="noindex" />
      {siteHeader}
      <Region id={Region === "main" ? mainId : undefined} tabIndex={Region === "main" ? -1 : undefined} className={className ? `cap-error-page ${className}` : "cap-error-page"} data-status={words.status}>
        <Empty kind="failed" titleAs="h1" title={words.title} action={action}>
          {thrown ? thrown.message : words.text}
        </Empty>
        {children}
        {thrown?.stack ? (
          // Focusable and named: a region that scrolls must be reachable by keyboard.
          <pre className="cap-error-page-stack" tabIndex={0} role="region" aria-label="Stack trace">
            <code>{thrown.stack}</code>
          </pre>
        ) : null}
      </Region>
      {siteFooter}
    </>
  );
}
