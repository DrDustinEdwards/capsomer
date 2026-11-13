---
name: subscribe-links
title: Subscribe links
summary: Where to follow a show or a site, as a titled card of pill links to each app and the feed.
group: pattern
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

## Usage

```html
<section class="cap-subscribe" aria-labelledby="subscribe">
  <h2 class="cap-subscribe-title" id="subscribe">Listen and subscribe</h2>
  <ul class="cap-subscribe-list">
    <li><a class="cap-chip cap-subscribe-link" data-size="sm" href="https://podcasts.example.com/show" rel="external" data-link="away"><svg aria-hidden="true">...</svg>Example Podcasts</a></li>
    <li><a class="cap-chip cap-subscribe-link" data-size="sm" href="/feed/podcast/"><svg aria-hidden="true">...</svg>RSS</a></li>
    <li><a class="cap-subscribe-more" href="/subscribe">More ways to listen</a></li>
  </ul>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the links in order |

- A `section` named by its heading, and a `ul` of links.
- Every pill is at least `--target` tall, and its text reaches 4.5:1 (checked in the spec).
