# Email templates in Capsomer: design (D7.2)

Status: design only, for Dustin's review. No template code is built until he approves. Job: job_a1cd3ed31049, from design-centralize DECIDE 7.

## What is decided already

- Email templates live in Capsomer, which owns the family look (Dustin, D7).
- Every product already sends through the Cloudflare Email `send_email` binding. Only the templates move. A send helper is out of this job, and so is any Foxhound change.

## What I could not read (unverified)

This driver can reach the Capsomer repo only. The senders named in the job were not read, so everything below that depends on them is a proposal to check, not a finding:

- foxhound `app/lib/email/*` (send, dispatch, events, `demo/email-copy.ts`, the CAN-SPAM guard, unsubscribe tokens)
- foxing `apps/web/app/lib/email.server.ts`
- txasm `app/lib/email.server.ts` (`magicLinkEmail`)
- carrel `app/lib/health.server.ts` and `ai.server.ts` alert mails
- dustinedwards-info `workers/watchdog.ts` alert mail

Capsomer itself has no email code today. The word only appears in unrelated component code.

## The template API

One definition makes both parts of a message, so the HTML and the text can never disagree.

```ts
import { renderEmail, magicLink } from "capsomer/email";

const { subject, html, text } = renderEmail(magicLink, {
  brand: { name: "Carrel", family: "purple" },
  to: "reader@example.com",
  url: "https://carrel.example/auth/verify?t=...",
  expiresIn: "15 minutes",
});
```

- A template is a plain object: `subject(data)`, and a list of typed blocks (`heading`, `paragraph`, `button`, `code`, `note`, `fine print`). `renderEmail` writes the HTML and the text from the same blocks. Nothing else writes markup.
- Pure functions, no dependency, no filesystem or `fetch`, so it runs in a Worker, in Node and in a test.
- Every value that reaches the HTML is escaped by `renderEmail`. A template author never concatenates a string into markup. Links are accepted only as `https:` (or `mailto:`) URLs; anything else throws, and a throw is never swallowed.
- The text part prints the link in full on its own line, because a plain-text reader cannot click a button.
- No tracking pixel and no click-tracking rewrite. A token in a URL is passed through untouched.

## Look: what email forces

Email clients ignore most of what the components rely on, so the email layer is its own small set of rules, not a reuse of the component CSS:

- Layout is a single centred column, 600px wide at most, built from nested tables with inline styles. No custom properties, no `@layer`, no container queries, no web fonts.
- Colours come from the same generator as the site. At build time `scale(seed)` in `tokens/palette.mjs` is evaluated for the product's family and the literal hexes are written inline: step 9 for the button fill with its paired label colour, step 12 for text, step 3 for the card background, step 6 for rules. The contrast pairs are checked by the same `failures()` check that guards the tokens, so a family cannot ship an email whose button label or body text is below 4.5:1.
- Light is the base. Dark mode is best effort through `color-scheme` and `prefers-color-scheme`, with the same pairs from the dark scale. A client that ignores it still gets a readable light mail.
- Fonts are the system stack. The button is a real link with a fill and a visible text label, never an image. Meaning is never carried by colour alone: the alert level is a word in the subject and in the first line.
- Width and touch: the button is at least 44px high, the type at least 16px, and the layout works at 320px with no horizontal scroll.

## The template list

| Template | Purpose | Data it takes |
| --- | --- | --- |
| `magicLink` | Sign in with one link | url, expiresIn |
| `verification` | Confirm an address | url, expiresIn |
| `reset` | Reset a password | url, expiresIn, ignoreNote |
| `alert` | Something needs attention (a health check, a watchdog, an AI budget) | level (`crit`, `warn`, `info`), what, when, detail lines, optional url |
| `notice` | A plain message (a decision, a digest line, a change of terms) | title, body paragraphs, optional action |

Security rules for the first three: say who asked, say the link expires and works once, say what to do if it was not you, and never show the token anywhere except inside the one link. A fixture and a screenshot use an obviously fake token, for example `EXAMPLE-NOT-A-TOKEN`.

A marketing or bulk template is not in this list. Foxhound's unsubscribe tokens and CAN-SPAM footer are its own and stay in Foxhound; the API leaves a `footer` slot so that code can supply it.

## How a product keeps its own copy

- Capsomer owns the frame (layout, colour, type, footer slot) and the default wording.
- A product overrides wording per template by passing `copy`, a partial object of strings (subject, heading, the paragraphs, the button label), which `renderEmail` merges over the default and escapes like any other value. It cannot replace the frame or inject markup.
- A product that needs a template Capsomer does not have defines its own with the same block types, and gets the same frame, escaping and text part. It sends no raw HTML.
- The brand is `{ name, family }`. `family` is one of the generated families; a new family adds one seed and the check covers it.

## Tests (the minimal set)

- Unit: every template renders HTML and text from the same data; every dynamic value is escaped (a `<script>` and a `"` in each field); a `javascript:` URL throws; the text part holds the full URL.
- Contrast: every family, both schemes, through `failures()`. Seen failing once by planting a low-contrast seed before it is trusted.
- Layout: render each template to a 320px and a 600px page in Playwright for the screenshots, and run axe on the result (labels, link text, language, a title).
- A real mail client: I cannot run one from here. The review step needs Dustin's own inbox or a client-preview service. This is called out as not done, not assumed.

## Build order after approval

1. `capsomer/email` core (`renderEmail`, blocks, escaping, the frame) with its unit tests.
2. The five templates with a states page showing each in light and dark at 320 and 600px.
3. The contrast check across families.
4. A release as a minor version, with a CHANGELOG entry that names the new HTML contract and the swap each product makes.

## Questions for Dustin

1. Is light-only with best-effort dark acceptable, or must dark mode be exact?
2. Should the logo be an image (needs a hosted, allowed URL per product) or the product's name in type? I recommend the name in type: no image blocking, nothing to host.
3. Which product's mail should be the first to adopt it? I suggest Carrel's alerts, because it is the smallest sender I know of.
4. Is a dedicated Capsomer export (`capsomer/email`) right, or should it be its own package? I recommend the export, to keep one release train.

## Not verified, not done

- The existing senders were not read (see above); the template list and data fields may need to change when they are.
- No code, no screenshots and no real-mail-client check exist yet. This is a design PR and it stops here for the seat.
