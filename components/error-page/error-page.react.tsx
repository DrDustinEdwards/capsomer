import type { ReactNode } from "react";
import { Empty } from "../empty/empty.react.tsx";
import { buttonAttrs } from "../button/button-look.ts";

// The page a React Router root ErrorBoundary renders: the failed Empty in plain words for 404, 410
// and everything else, with the site's own header kept so the skip link and landmarks stay. A route
// error is read by its shape, so the package keeps no router dependency.

export interface ErrorWords {
  status: number;
  title: string;
  // What went wrong, under the title. A 410 has none; its title says it.
  text?: string;
}

// A route error response has a numeric status and a string statusText; that is all isRouteErrorResponse checks besides a private flag.
function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const { status, statusText } = error as { status?: unknown; statusText?: unknown };
  return typeof status === "number" && typeof statusText === "string" ? status : null;
}

// The statusText site-runtime's databaseDown() gives the 503 thrown when D1 is down.
const DATABASE_DOWN = /database/i;

/** What the page says for an error: its status, a title and, when it failed, one plain sentence. */
export function errorWords(error: unknown): ErrorWords {
  const status = statusOf(error);
  if (status === 404)
    return {
      status,
      title: "Page not found",
      text: "Nothing is at this address.",
    };
  if (status === 410)
    return {
      status,
      title: "This page was taken down",
    };
  if (status === 403)
    return {
      status,
      title: "You cannot open this page",
      text: "Your account does not have access.",
    };
  if (status !== null && status < 500)
    return {
      status,
      title: "This page cannot be shown",
      text: `The request was refused (${status}).`,
    };
  if (status === 503) {
    const { statusText } = error as { statusText: string };
    if (DATABASE_DOWN.test(statusText))
      return {
        status,
        title: "The site's data is unavailable",
        text: "Its database is not answering. Try again in a few minutes.",
      };
    return {
      status,
      title: "This page is unavailable for now",
      text: "The site is busy or being updated. Try again in a few minutes.",
    };
  }
  return {
    status: status ?? 500,
    title: "Something went wrong",
    text: "The page could not be shown. Try again in a moment.",
  };
}

/** The title for the root `meta` on the error path: "Page not found | Site name". */
export function errorTitle(error: unknown, siteName: string): string {
  return `${errorWords(error).title} | ${siteName}`;
}

export interface ErrorPageProps {
  error: unknown;
  home: string;
  // The site's header, so its skip link and banner landmark stay. It must read no loader data: on the
  // error path there is none. Without one, the page draws its own skip link.
  siteHeader?: ReactNode;
  siteFooter?: ReactNode;
  children?: ReactNode;
  // Development only: show the thrown error's message and stack. Off by default so production never shows a stack.
  dev?: boolean;
  mainId?: string;
  className?: string;
  // The site's own words in place of errorWords' for this error. A 410 shows its title alone, so it takes no text.
  title?: string;
  text?: string;
  homeLabel?: string;
  // An icon after the home link's words: an svg with data-icon="end" and aria-hidden="true", so the
  // button pulls its padding in and the link's name stays its words.
  homeIcon?: ReactNode;
  // Render as a div when the site's Layout already wraps every page in its main, so the page keeps one main.
  as?: "main" | "div";
  actions?: ReactNode;
  // A 410 is a page taken down on purpose: no alert, no retry. `gone` names its one way out in place of the home link.
  gone?: { href: string; label: string };
  // The site's own title band in place of the heading: it gets the words and draws the h1.
  hero?: (words: ErrorWords) => ReactNode;
}

// The actions are plain button-styled links so this page, in every app's root bundle, takes neither
// ButtonLink nor the router; after an error a full load is what the visitor wants.
const primary = buttonAttrs({ variant: "primary" }, undefined);
const plain = buttonAttrs({}, undefined);

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
  homeIcon,
  as: Region = "main",
  actions,
  gone,
  hero,
}: ErrorPageProps) {
  const found = errorWords(error);
  const words = { status: found.status, title: title ?? found.title, text: text ?? found.text };
  const thrown = dev && error instanceof Error ? error : null;
  const server = words.status >= 500;
  const withdrawn = words.status === 410;
  const action = withdrawn ? (
    <>
      <a {...primary} href={gone?.href ?? home}>
        {gone?.label ?? homeLabel}
        {homeIcon}
      </a>
      {actions}
    </>
  ) : (
    <>
      {server ? (
        // An empty href is this address: a reload that works before hydration and with no script.
        // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- an empty href reloads this address, with no script too
        <a {...primary} href="">
          Try again
        </a>
      ) : null}
      <a {...(server ? plain : primary)} href={home}>
        {homeLabel}
        {homeIcon}
      </a>
      {actions}
    </>
  );
  const message = hero ? (
    <>
      {hero(words)}
      <div className="cap-error-page-body">
        {thrown || (words.text && !withdrawn) ? (
          <p className="cap-empty-text">{thrown ? thrown.message : words.text}</p>
        ) : null}
        <div className="cap-empty-content">{action}</div>
      </div>
    </>
  ) : withdrawn ? (
    <Empty kind="nothing-yet" titleAs="h1" title={words.title} action={action} />
  ) : (
    <Empty kind="failed" titleAs="h1" title={words.title} action={action}>
      {thrown ? thrown.message : words.text}
    </Empty>
  );
  return (
    <>
      {/* React hoists it into head: an error page is never indexed. */}
      <meta name="robots" content="noindex" />
      {siteHeader ??
        (Region === "main" ? (
          <a className="cap-skip" href={`#${mainId}`}>
            Skip to content
          </a>
        ) : null)}
      <Region
        id={Region === "main" ? mainId : undefined}
        tabIndex={Region === "main" ? -1 : undefined}
        className={className ? `cap-error-page ${className}` : "cap-error-page"}
        data-status={words.status}
      >
        {message}
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

export interface SignedOutPageProps {
  app: string;
  signIn: string;
  byChoice: boolean;
  mainId?: string;
}

// The page an app shows once its session is gone. Nothing failed, so it is a status, not an alert.
export function SignedOutPage({ app, signIn, byChoice, mainId = "main" }: SignedOutPageProps) {
  return (
    <main id={mainId} tabIndex={-1} className="cap-error-page" data-status="signed-out">
      <meta name="robots" content="noindex" />
      <Empty
        kind="nothing-yet"
        role="status"
        titleAs="h1"
        title={byChoice ? `Signed out of ${app}` : `Your ${app} session ended`}
        action={
          <a {...primary} href={signIn}>
            {byChoice ? "Sign in again" : "Reload to sign in"}
          </a>
        }
      />
    </main>
  );
}
