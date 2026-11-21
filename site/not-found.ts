// The page for an address that does not exist, written to 404.html at build (site/vite.config.ts): the Worker sends it
// with status 404 (worker/index.ts). It keeps the site's letterhead, with its skip link and nav, and its footer.
import { FOOTER, header } from "./chrome.ts";
import { firsts, type Data } from "./content.ts";

export const NOT_FOUND_PAGE = {
  path: "/404.html",
  title: "Page not found",
  description: "Nothing is at this address.",
};

export function renderNotFound(d: Data): string {
  return `${header("", firsts(d))}
<main id="main" tabindex="-1">
<div class="cap-page statement-page">
  <h1 class="statement-title">Page not found</h1>
  <p>Nothing is at this address. <a href="/">Go to Capsomer's front page</a>.</p>
</div>
</main>
${FOOTER}`;
}
