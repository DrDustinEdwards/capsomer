---
"capsomer": minor
---

Let the layout explain (Dustin, 2026-11-18; DEFAULTS.md): the slots whose only use was a subtitle, eyebrow, note or helper line are gone, and the default strings say less.

Removed props: `PageHead` `lead`; `SettingsLayout` `lead`; `ProsePage` / `ProsePageHead` `lead`; `DocumentViewer` `subtitle`; `Panel` `description` (and so `TablePanel`, `GeneratedFile` and `ChartPanel` `description`); `Hero` `eyebrow` and `note`; `CtaBand` `eyebrow` and `note`; `FeatureBlock` `eyebrow`; `SettingsRow` `help` and `SwitchRow` `help` (`disabledReason` stays); `NewsletterSignup` `text`; `AttentionList` `emptyText` and `emptyLaterText`; `Catalog` `emptyText`; `SignedOutPage` `access`; `PickerWords` `lead`. `ApprovalQueue` `empty` is `{ title }` (no `text`). `noticesDetail` on the attention list has no default.

Removed classes: `cap-page-head-lead`, `cap-prose-page-lead` (and its `--cap-prose-page-lead-text`), `cap-docview-sub`, `cap-panel-desc`, `cap-hero-note`, `cap-cta-band-note`, `cap-settings-row-help`, `cap-newsletter-text`, `cap-md-hint`, `cap-md-toolbar-hint`. The hero no longer spaces a `.cap-eyebrow` above its title.

Changed HTML contracts: a settings row's locked reason is its own `<p class="cap-settings-row-reason" id>` under the label (it was a span inside the help line), and the `SettingsRow` children get `{ labelId, reasonId }` (was `helpId`). `Empty` takes a body (`cap-empty-text`) only for `kind="failed"`: `EmptyProps` is a union, and any other kind is a title and its one action. A 410 error page is its title alone ("This page was taken down"), so `ErrorWords.text` is optional; `SignedOutPage` says it in its title ("Signed out of X", "Your X session ended"). The rich and Markdown editors drop the drop hint and the "Type /" toolbar line. The showcase prints no lead under a page's `h1` (the summary stays the page's meta description and search entry), and a states page prints its `h1` alone.

Renamed: `EMPTY_TEXT` (moderation queue model) is `EMPTY_TITLE`, a title per view. `emptyWords` (posts list, media library, mentions list) returns `{ kind, title }`.

Shorter defaults: the error page's sentences, the empty states of the attention list, approval queue, moderation queue, mentions, posts, media library, read state, catalog, AI engine settings and 404 report (title only), the "is not offered" lines in the posts list and media library, the alt-text help in media, media library and the editors, the consent intro, approval sheet lead, flag list notes, collab editor notes, mode banner, secret reveal, shortcuts note, usage meter, people roles, writing progress, chart builder, publish gate and a few dialog descriptions that restated their title.
