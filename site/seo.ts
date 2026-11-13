/**
 * The site's search and AI surface, from Prelum (`@drdustinedwards/site-helpers`), the family's one
 * SEO module: the front page's head tags and JSON-LD, and the sitemap, robots.txt (the family bot
 * policy; Cloudflare puts its own lines first), ai.txt (citation welcome, training reserved, as the
 * tdm-reservation header in _headers says), llms.txt (https://llmstxt.org; llms-full.txt and each page's Markdown copy come from prelum-markdown after the build), security.txt and the
 * IndexNow key file. site/vite.config.ts writes them into the build. The pages are the five sections: Themes (the front
 * page at / and /themes/<part>/), Components (/components/<name>/, patterns too), Primitives (/primitives/<name>/), Icons
 * and Colors; search stays out of the index.
 */
import { defineHead, headHtml } from "@drdustinedwards/site-helpers/head";
import { iconLinks, webManifest } from "@drdustinedwards/site-helpers/icons";
import { llmsDocument } from "@drdustinedwards/site-helpers/llms";
import { aiTxt, robotsDocument } from "@drdustinedwards/site-helpers/robots";
import { graph, jsonLd, thing, website } from "@drdustinedwards/site-helpers/schema";
import { sitemapDocument } from "@drdustinedwards/site-helpers/sitemap";
import { securityTxt } from "@dustinedwards/site-runtime/security-txt";

/** The production origin (rulings.md, rule 16): a workers.dev copy must not claim to be the page. */
const ORIGIN = "https://capsomer.dustinedwards.info";
const REPO = "https://github.com/DrDustinEdwards/capsomer";
/** The IndexNow key, served as /<key>.txt; .github/workflows/ci.yml's indexnow job reads it from here. Public by design. */
const INDEXNOW_KEY = "7c3439c6084107d16882b2cecf775765";
/** When security.txt lapses (RFC 9116 asks for under a year); renew it before then. */
const SECURITY_TXT_EXPIRES = "2027-10-25T00:00:00Z";
const DESCRIPTION =
  "An open-source design system in plain CSS, with optional React wrappers: components, design tokens, themes and page patterns, checked against WCAG 2.2 AA.";
const AUTHOR = {
  "@type": "Person",
  "@id": "https://dustinedwards.info/#person",
  name: "Dustin Edwards",
  url: "https://dustinedwards.info",
};

const head = defineHead({
  origin: ORIGIN,
  siteName: "Capsomer",
  image: {
    url: "/og-card.png",
    width: 1200,
    height: 630,
    alt: "Capsomer, an open-source design system",
  },
  suffix: " · Capsomer",
  locale: "en_US",
});

/**
 * A page's head: the color-scheme and text-scale metas, title (`title` and the " · Capsomer" suffix), description, canonical, Open Graph and Twitter with the card,
 * and on an indexed page its WebPage and breadcrumb; the front page also carries the site's JSON-LD.
 */
export function siteHead(page: Page): string {
  return `${PAGE_META}\n${seoHead(page)}`;
}

type Page =
  | "home"
  | {
      path: string;
      title: string;
      description: string;
      noindex?: boolean;
      // The section a page sits in, by its name and first page, for the trail.
      section?: { name: string; path: string };
    };

// Every page's color-scheme hint (theme.js and the theme switch set it to the choice; "light dark" follows the system)
// and its opt-in to the reader's system text size (Modern Web Guidance, respect-os-text-scale).
const PAGE_META =
  '<meta name="color-scheme" content="light dark" />\n<meta name="text-scale" content="scale" />';

function seoHead(page: Page): string {
  // Pages are served at their slash (a bare path redirects to it), so the canonical and the trail keep it. A page
  // inside a section (a theme part, a component, a primitive) carries its trail: Capsomer, the section, the page.
  if (typeof page === "object") {
    const { section, ...rest } = page;
    return headHtml(
      head({
        ...rest,
        keepTrailingSlash: true,
        breadcrumbs: section
          ? [{ name: "Capsomer", path: "/" }, section, { name: page.title, path: page.path }]
          : false,
      }),
    );
  }
  return headHtml([
    ...head({ path: "/", title: "Capsomer", fullTitle: true, description: DESCRIPTION }),
    jsonLd(
      graph([
        website({
          origin: ORIGIN,
          name: "Capsomer",
          description: DESCRIPTION,
          searchUrl: `${ORIGIN}/search/?q={search_term_string}`,
          publisher: AUTHOR,
        }),
        thing("SoftwareSourceCode", {
          "@id": `${ORIGIN}/#code`,
          name: "Capsomer",
          description:
            "Plain CSS in cascade layers on design tokens, with optional behavior modules and React components, an app shell and page patterns.",
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

/** The family icon set's links, on every page (site/vite.config.ts); the files are in site/public. */
export const ICON_TAGS = iconLinks()
  .map(
    (link) =>
      `<link ${Object.entries(link)
        .map(([name, value]) => `${name}="${value}"`)
        .join(" ")} />`,
  )
  .join("\n");

/** The discovery files, by their path in the built site; `paths` are the indexed pages. */
export function discoveryFiles(paths: string[]): Record<string, string> {
  return {
    "sitemap.xml": sitemapDocument(paths.map((path) => ({ loc: `${ORIGIN}${path}` }))),
    ".well-known/security.txt": securityTxt({
      origin: ORIGIN,
      contact: "security@dustinedwards.info",
      expires: SECURITY_TXT_EXPIRES,
    }),
    [`${INDEXNOW_KEY}.txt`]: INDEXNOW_KEY,
    "robots.txt": robotsDocument({
      origin: ORIGIN,
      notes: [`AI usage policy: ${ORIGIN}/ai.txt`, `LLM guide: ${ORIGIN}/llms.txt`],
    }),
    "site.webmanifest": JSON.stringify(
      webManifest({
        name: "Capsomer",
        description: DESCRIPTION,
        themeColor: "#752c6a",
        backgroundColor: "#752c6a",
        lang: "en",
      }),
    ),
    "ai.txt": aiTxt({ origin: ORIGIN, name: "Capsomer", contact: "contact@dustinedwards.info" }),
    "llms.txt": llmsDocument({
      title: "Capsomer",
      summary:
        "Capsomer is an open-source (MIT) design system for any site or app: plain CSS in cascade layers on design tokens, with optional behavior modules and React components, an app shell and page patterns. Ten color families in light and dark; every component's states are scanned with axe against WCAG 2.2 AA; scripts work under Trusted Types. Install from a GitHub release tag (not on npm). It also runs Dustin Edwards's sites.",
      intro: [
        [
          `- Docs: ${ORIGIN}/ (Themes: every token on a live board; Components and patterns, each with live examples and its API; Primitives; Icons; Colors)`,
          `- Parts: the package's capsomer/parts.json lists every component's classes, parts, data attributes, states and CSS variables`,
          `- Code: ${REPO}`,
          "- Author: Dustin Edwards, https://dustinedwards.info",
        ].join("\n"),
      ],
      sections: [
        {
          heading: "Documentation",
          links: [
            {
              title: "README",
              url: `${REPO}#readme`,
              description: "what Capsomer holds and how apps use it",
            },
            {
              title: "Components",
              url: `${REPO}/tree/main/components`,
              description:
                "one folder per component, each with its README, CSS and examples; how one is built is components/README.md",
            },
            {
              title: "Defaults",
              url: `${REPO}/blob/main/DEFAULTS.md`,
              description: "the design defaults and their reasons",
            },
            {
              title: "Every component page in full",
              url: `${ORIGIN}/llms-full.txt`,
              description: "one file, for a reader that takes a single document",
            },
            {
              title: "Changelog",
              url: `${REPO}/blob/main/CHANGELOG.md`,
              description: "every release and its breaking changes",
            },
          ],
        },
      ],
    }),
  };
}
