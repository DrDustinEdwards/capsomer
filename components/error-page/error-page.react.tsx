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
  if (status === 404)
    return {
      status,
      title: "Page not found",
      text: "There is nothing at this address. Check it for a typo, or start again from the home page.",
    };
  if (status === 410)
    return {
      status,
      title: "This page is gone",
      text: "It was taken down on purpose and is not coming back.",
    };
  if (status === 403)
    return {
      status,
      title: "You cannot open this page",
      text: "Your account does not have access to it. If you think it should, ask whoever manages this site.",
    };
  if (status !== null && status < 500)
    return {
      status,
      title: "This page cannot be shown",
      text: `The request was refused (${status}). Start again from the home page.`,
    };
  if (status === 503) {
    const { statusText } = error as { statusText: string };
    if (DATABASE_DOWN.test(statusText))
      return {
        status,
        title: "The site's data is unavailable",
        text: "Its database is not answering for the moment. Nothing you did caused this; try again in a few minutes.",
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
    text: "The page could not be shown. It is not something you did; try again in a moment.",
  };
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
  // More ways out, after the home link: "Go to dashboard", "View demo".
  actions?: ReactNode;
  // A 410 is a page taken down on purpose: nothing went wrong, so it is no alert and offers no
  // retry. `gone` names its one way out ("Read the blog", "/blog") in place of the home link.
  gone?: { href: string; label: string };
  // The site's own title band in place of the message's heading (a site that keeps a client's
  // brand lays its error page out as an interior page): it gets the words and draws the h1; the
  // sentence and the ways out follow it in the page's column.
  hero?: (words: ErrorWords) => ReactNode;
  // A class for the body under a `hero` band, beside cap-error-page-body: the site's own prose frame
  // (its type and leading for the sentence).
  bodyClassName?: string;
  // An icon after the words of the main way out (the home link, or a 410's), as the site's own buttons
  // end with one. Hidden from assistive tech: pass the icon alone, with no words of its own.
  linkIcon?: ReactNode;
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
  actions,
  gone,
  hero,
  bodyClassName,
  linkIcon,
}: ErrorPageProps) {
  const found = errorWords(error);
  const words = { status: found.status, title: title ?? found.title, text: text ?? found.text };
  const thrown = dev && error instanceof Error ? error : null;
  const server = words.status >= 500;
  const withdrawn = words.status === 410;
  const icon = linkIcon ? (
    <span className="cap-error-page-link-icon" aria-hidden="true">
      {linkIcon}
    </span>
  ) : null;
  const action = withdrawn ? (
    <>
      <a className="cap-btn" data-variant="primary" href={gone?.href ?? home}>
        {gone?.label ?? homeLabel}
        {icon}
      </a>
      {actions}
    </>
  ) : (
    <>
      {server ? (
        // An empty href is this address: a reload that works before the page hydrates, and with no script.
        // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- an empty href reloads this address, with no script too
        <a className="cap-btn" data-variant="primary" href="">
          Try again
        </a>
      ) : null}
      <a className="cap-btn" data-variant={server ? undefined : "primary"} href={home}>
        {homeLabel}
        {icon}
      </a>
      {actions}
    </>
  );
  const message = hero ? (
    <>
      {hero(words)}
      <div
        className={bodyClassName ? `cap-error-page-body ${bodyClassName}` : "cap-error-page-body"}
      >
        <p className="cap-empty-text">{thrown ? thrown.message : words.text}</p>
        <div className="cap-empty-content">{action}</div>
      </div>
    </>
  ) : (
    <Empty
      kind={withdrawn ? "nothing-yet" : "failed"}
      titleAs="h1"
      title={words.title}
      action={action}
    >
      {thrown ? thrown.message : words.text}
    </Empty>
  );
  return (
    <>
      {/* React hoists it into head: an error page is never indexed. */}
      <meta name="robots" content="noindex" />
      {siteHeader}
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
  // The app's name: "Capsid Portal".
  app: string;
  // Where signing in starts again: the app's own address.
  signIn: string;
  // The person signed out here (true), or the session ended on its own (false).
  byChoice: boolean;
  // Under Access, an open Access session may sign the person straight back in: say so.
  access?: boolean;
  mainId?: string;
}

// The page an app shows once its session is gone: a polite status, one heading and one way back.
// It is not an error (nothing failed), so it is a status, not an alert.
export function SignedOutPage({
  app,
  signIn,
  byChoice,
  access,
  mainId = "main",
}: SignedOutPageProps) {
  const text = byChoice
    ? `You signed out of ${app} in this browser.${access ? " Signing in again may not ask for your email while your Access session is still open." : ""}`
    : `Your ${app} session ended, so the page stopped updating.`;
  return (
    <main id={mainId} tabIndex={-1} className="cap-error-page" data-status="signed-out">
      <meta name="robots" content="noindex" />
      <div className="cap-empty" data-kind="nothing-yet" role="status">
        <div className="cap-empty-header">
          <h1 className="cap-empty-title">Signed out</h1>
          <p className="cap-empty-text">{text}</p>
        </div>
        <div className="cap-empty-content">
          <a className="cap-btn" data-variant="primary" href={signIn}>
            {byChoice ? "Sign in again" : "Reload to sign in"}
          </a>
        </div>
      </div>
    </main>
  );
}
