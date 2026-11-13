import { ErrorPage, errorWords } from "../error-page/error-page.react.tsx";
import { FIRST_PAGE } from "./apps.tsx";

// The error page of an admin area's layout route (its ErrorBoundary export). The layout itself
// failed, so the shell is not drawn: the page is the shared error page, its way out the admin's
// first page, and a refusal's own words (a thrown data("Your account is not a member", 403)) are the
// sentence, never a login page. Every admin area exports this, so each one fails the same way.
export interface AdminErrorViewProps {
  // The ErrorBoundary's error.
  error: unknown;
  // The admin's first page: "/admin".
  home: string;
  // Its name on the way out. Default "Go to the Overview" (FIRST_PAGE).
  homeLabel?: string;
  dev?: boolean;
}

function refusalText(error: unknown): string | undefined {
  const data = (error as { data?: unknown } | null)?.data;
  return typeof data === "string" && data.trim() ? data : undefined;
}

export function AdminErrorView({ error, home, homeLabel, dev }: AdminErrorViewProps) {
  const words = errorWords(error);
  return (
    <ErrorPage
      error={error}
      home={home}
      homeLabel={homeLabel ?? `Go to the ${FIRST_PAGE}`}
      title={words.status === 403 ? "No access" : undefined}
      text={refusalText(error) ?? (words.status >= 500 ? "Nothing you wrote is lost." : undefined)}
      dev={dev}
    />
  );
}
