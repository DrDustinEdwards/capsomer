import { ErrorPage, errorWords } from "../error-page/error-page.react.tsx";
import { FIRST_PAGE } from "./apps.tsx";

// The error page of an admin area's layout route (its ErrorBoundary). The shell is not drawn because the layout
// itself failed; a refusal's own words are the sentence, never a login page. Every admin area exports this.
export interface AdminErrorViewProps {
  error: unknown;
  home: string;
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
