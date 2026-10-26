/**
 * The site's search and AI surface, from Prelum (`@drdustinedwards/site-helpers`), the family's one
 * SEO module: the front page's head tags and JSON-LD, and the sitemap, robots.txt (the family bot
 * policy; Cloudflare puts its own lines first), ai.txt (citation welcome, training reserved, as the
 * tdm-reservation header in _headers says), llms.txt (https://llmstxt.org), security.txt and the
 * IndexNow key file. site/vite.config.ts writes them into the build. The public pages are the front page
 * at /, the theme builder at /make/ and each component's page at /components/<name>/; the admin at /admin/ keeps its sections at hash
 * addresses and stays out of search.
 */
import { headHtml, headTags } from "@drdustinedwards/site-helpers/head";
import { llmsDocument } from "@drdustinedwards/site-helpers/llms";
import { aiTxt, robotsDocument } from "@drdustinedwards/site-helpers/robots";
import { graph, jsonLd, thing, website } from "@drdustinedwards/site-helpers/schema";
import { sitemapDocument } from "@drdustinedwards/site-helpers/sitemap";
import { securityTxt } from "@dustinedwards/site-runtime/security-txt";

/** The production origin (rulings.md, rule 16): a workers.dev copy must not claim to be the page. */
const ORIGIN = "https://capsomer.dustinedwards.info";
const REPO = "https://github.com/DrDustinEdwards/capsomer";
/** The IndexNow key, served as /<key>.txt; .github/workflows/indexnow.yml reads it from here. Public by design. */
const INDEXNOW_KEY = "7c3439c6084107d16882b2cecf775765";
/** When security.txt lapses (RFC 9116 asks for under a year); renew it before then. */
const SECURITY_TXT_EXPIRES = "2027-10-25T00:00:00Z";
const DESCRIPTION =
  "Capsomer: the shared design system for Dustin Edwards's sites and apps. Six color families, three faces, every component in every state, in plain CSS.";
const AUTHOR = { "@type": "Person", "@id": "https://dustinedwards.info/#person", name: "Dustin Edwards", url: "https://dustinedwards.info" };

/** The theme builder's description, for its head tags (site/vite.config.ts). */
export const MAKE_DESCRIPTION =
  "Make a light and dark theme from one brand color: 12-step scales, every pair checked against WCAG 2.2, faces, sizes and corners, a live preview, and the CSS and design tokens.";

const ADMIN_DESCRIPTION =
  "Capsomer's admin: every token, every component in every state, and each component's test results.";

/** A page's head: title, description, canonical, Open Graph and Twitter with the card; the public page also carries the JSON-LD, and the admin says noindex so search shows the public page. */
export function siteHead(page: "home" | "admin" | { path: string; title: string; description: string }): string {
  const card = { url: "/og-card.png", width: 1200, height: 630, alt: "Capsomer, the family design system" };
  // A component's own public page: indexed, with its own title and its summary.
  if (typeof page === "object")
    return headHtml(headTags({ origin: ORIGIN, path: page.path, title: page.title, description: page.description, image: card, siteName: "Capsomer", locale: "en_US" }));
  if (page === "admin")
    return headHtml(
      headTags({ origin: ORIGIN, path: "/admin/", title: "Capsomer admin", description: ADMIN_DESCRIPTION, image: card, siteName: "Capsomer", locale: "en_US", noindex: true }),
    );
  return headHtml([
    ...headTags({
      origin: ORIGIN,
      path: "/",
      title: "Capsomer",
      description: DESCRIPTION,
      image: card,
      siteName: "Capsomer",
      locale: "en_US",
    }),
    jsonLd(
      graph([
        website({ origin: ORIGIN, name: "Capsomer", description: DESCRIPTION, publisher: AUTHOR }),
        thing("SoftwareSourceCode", {
          "@id": `${ORIGIN}/#code`,
          name: "Capsomer",
          description: "Plain CSS with design tokens, web components and React wrappers, an app shell and patterns.",
          url: ORIGIN,
          codeRepository: REPO,
          license: "https://opensource.org/licenses/MIT",
          programmingLanguage: ["CSS", "TypeScript"],
          author: AUTHOR,
        }),
      ]),
    ),
  ]);
}

/** The discovery files, by their path in the built site. */
export function discoveryFiles(components: string[]): Record<string, string> {
  return {
    "sitemap.xml": sitemapDocument([{ loc: `${ORIGIN}/` }, { loc: `${ORIGIN}/make/` }, ...components.map((name) => ({ loc: `${ORIGIN}/components/${name}/` }))]),
    ".well-known/security.txt": securityTxt({ origin: ORIGIN, contact: "security@dustinedwards.info", expires: SECURITY_TXT_EXPIRES }),
    [`${INDEXNOW_KEY}.txt`]: INDEXNOW_KEY,
    "robots.txt": robotsDocument({ origin: ORIGIN, notes: [`AI usage policy: ${ORIGIN}/ai.txt`, `LLM guide: ${ORIGIN}/llms.txt`] }),
    "ai.txt": aiTxt({ origin: ORIGIN, name: "Capsomer", contact: "contact@dustinedwards.info" }),
    "llms.txt": llmsDocument({
      title: "Capsomer",
      summary:
        "Capsomer is Dustin Edwards's open-source (MIT) design system: plain CSS with design tokens, web components and React wrappers, an app shell and patterns, shared by his sites and apps (dustinedwards.info, the Capsid Portal, Carrel and others). No CSS framework; light and dark themes; every component tested for accessibility in every state.",
      intro: [
        [
          `- Showcase: ${ORIGIN}/ (the color families, type, every component with its own page, the defaults and how to install)`,
          `- Admin: ${ORIGIN}/admin/ (an interactive page: every token, every component in every state, and each component's test results)`,
          `- Code: ${REPO}`,
          "- Author: Dustin Edwards, https://dustinedwards.info",
        ].join("\n"),
      ],
      sections: [
        {
          heading: "Documentation",
          links: [
            { title: "README", url: `${REPO}#readme`, description: "what Capsomer holds and how apps use it" },
            { title: "Components", url: `${REPO}/tree/main/components`, description: "one folder per component, each with its README, CSS and examples; how one is built is components/README.md" },
            { title: "Defaults", url: `${REPO}/blob/main/DEFAULTS.md`, description: "the design defaults and their reasons" },
            { title: "Changelog", url: `${REPO}/blob/main/CHANGELOG.md`, description: "every release and its breaking changes" },
          ],
        },
      ],
    }),
  };
}
