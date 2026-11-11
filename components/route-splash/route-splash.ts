// When an app shows its route splash: during a plain navigation that is still loading, never
// during the revalidation after a form post (React Router's "loading" state carries the
// submission's formMethod then; splashing on it would blank the page after every action), and
// only on the paths the app names. The shape is React Router's `Navigation`, narrowed so the rule
// needs no router to test.

export type SplashNavigation = {
  state: "idle" | "loading" | "submitting";
  formMethod?: string | undefined;
  location?: { pathname: string } | undefined;
};

// A trailing slash is the same page.
export function normalPath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function shouldShowRouteSplash(
  navigation: SplashNavigation,
  isSplashPath: (pathname: string) => boolean,
): boolean {
  if (navigation.state !== "loading") return false;
  if (navigation.formMethod != null) return false;
  const pathname = navigation.location?.pathname;
  return pathname != null && isSplashPath(normalPath(pathname));
}
