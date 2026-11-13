---
name: subscribe-links
title: Subscribe links
summary: Where to follow a show or a site, as a titled card of pill links to each app and the feed.
parts: [css, react]
tool: native
states: [apps, feed and more, hover]
added: 0.94.0
source: germomics' SubscribeRow (app/components/content/PostDetail.tsx, lib/subscribe.ts)
replaces:
  - 'Listen and subscribe'
  - 'function SubscribeRow'
---

# Subscribe links

A card at the foot of an episode or a post: a heading ("Listen and subscribe"), then one pill link for each place to follow (Apple Podcasts, Spotify, the RSS feed), and a quieter link to the page with every way.

## When to use it

On an episode or a post page of a site that publishes a feed or a show, after the content.

## When not to

- **Sharing this page**: the share row.
- **An email signup form**: a form, with its field.

## The default and its reason

- **Each destination is a link** with its own name ("Spotify"), so the list reads as places, not icons. The app's mark is decoration (`aria-hidden`).
- **A link to another site carries the away mark** (`data-link="away"`, `rel="external noopener noreferrer"`) and its words, "(opens another site)", from the link system (`AwayLink`). The heading's id is generated unless `headingId` names one, so two cards on a page never share it.
- **The site's own feed and its "more ways" page** sit last; "more" is quieter, so the apps lead.
- **The destinations are the site's data** (its `show_config`): the component draws what it is given and nothing when it is given none.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the links in order |

## Accessibility

- A `section` named by its heading, and a `ul` of links.
- Every pill is at least `--target` tall, and its text reaches 4.5:1 (checked in the spec).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

```html
<section class="cap-subscribe" aria-labelledby="subscribe">
  <h2 class="cap-subscribe-title" id="subscribe">Listen and subscribe</h2>
  <ul class="cap-subscribe-list">
    <li><a class="cap-chip cap-subscribe-link" data-size="sm" href="https://podcasts.example.com/show" data-link="away" rel="external noopener noreferrer"><svg aria-hidden="true">...</svg>Example Podcasts<span class="cap-sr-only"> (opens another site)</span></a></li>
    <li><a class="cap-chip cap-subscribe-link" data-size="sm" href="/feed/podcast/"><svg aria-hidden="true">...</svg>RSS</a></li>
    <li><a class="cap-subscribe-more" href="/subscribe">More ways to listen</a></li>
  </ul>
</section>
```

React: `SubscribeLinks` from `capsomer/react/subscribe-links` takes `title`, `headingId`, `level`, `links` (`href`, `label`, `icon`, `away`), `more` and `renderLink`. Load `chips.css` (each link is a chip), `subscribe-links.css` and `link.css`.

## Exceptions in production

None yet.
