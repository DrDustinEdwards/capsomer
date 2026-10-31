---
name: player
title: Player
summary: Video, audio and embeds from a video or audio service, the same on a JSX page and in a post. An embed is the site's own poster with a play button and loads nothing from the service until the reader asks.
parts: [css, react]
tool: native + React
states: [embed with a poster, embed with no poster, audio embed, embed after a click, video, audio]
added: 0.56.0
source: Prelum's :::video, :::audio and ::embed (render-blocks.mjs) and render/enhance's click-to-load; Capsomer's prose blocks, which styled the first embed card
replaces:
  - '\.(video-facade|embed-facade|lite-youtube|yt-facade|podcast-player)\s*\{'
  - "<iframe[^>]+(youtube|vimeo|spotify|soundcloud)"
---

# Player

One way to show a video, an audio file or another service's player. A JSX page renders `Video`, `Audio` or `Embed` from `capsomer/react/player`; a post gets the same markup from Prelum's `:::video`, `:::audio` and `::embed`. Both import `capsomer/player.css`.

## When to use it

- A video or a recording the site hosts in its library.
- A talk on YouTube or Vimeo, an episode on Spotify or SoundCloud.

## When not to

- An animated image (a GIF): the picture (`capsomer/picture.css`), with its pause control.
- A chart or a diagram that moves: draw it still.

## The default and its reason

- **An embed loads nothing until a click.** It is a link to the service with the site's own poster from its library (never the service's thumbnail, which is a request to the service), a play button and a bar naming the service and the title. Without script the link opens the service; with script the player takes its place and focus moves into it. YouTube plays from its no-cookie host and Vimeo is told not to track.
- **A video needs a poster, a width and a height**, so the box holds its shape and the page downloads none of the video before play (`preload="none"`). Captions are a track; a transcript link sits under the player where there is one.
- **Audio downloads nothing before play** and always has its transcript one link away.
- **A song or an episode is a strip**, not a 16:9 screen (`data-service="spotify"` or `"soundcloud"`).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the embed, the player's own controls and the transcript link |
| Enter on an embed | Puts the player in its place and moves focus into it |

## Accessibility

- The embed is a link named by the service and the title; the play button and the poster are decoration (`aria-hidden`, `alt=""`). The player's iframe is named by the title.
- The video and audio are named by their title (`aria-label`); captions and transcripts are WCAG 1.2.1 to 1.2.3.
- Nothing plays by itself; the service's autoplay starts only after the reader's own click.
- Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<figure class="cap-player" data-kind="embed" data-service="youtube">
  <a class="cap-player-facade" href="https://www.youtube.com/watch?v=ID"
     data-embed-src="https://www.youtube-nocookie.com/embed/ID?autoplay=1" data-embed-title="The title">
    <img class="cap-player-poster" src="/media/poster.jpg?w=704" srcset="…" sizes="…" width="704" height="396" alt="" loading="lazy" decoding="async">
    <span class="cap-player-play" aria-hidden="true"></span>
    <span class="cap-player-label">Watch on YouTube: The title</span>
  </a>
  <figcaption>…</figcaption>
</figure>

<figure class="cap-player" data-kind="video">
  <video src="/media/demo.mp4" poster="/media/demo-poster.jpg?w=1408" width="1280" height="720" controls preload="none" playsinline aria-label="The title">
    <track kind="captions" src="/media/demo.vtt" srclang="en" label="English" default>
  </video>
  <p class="cap-player-transcript"><a href="/writing/demo-transcript">Transcript: The title</a></p>
  <figcaption>…</figcaption>
</figure>

<figure class="cap-player" data-kind="audio">
  <audio src="/media/talk.mp3" controls preload="none" aria-label="The title"></audio>
  <p class="cap-player-transcript"><a href="/writing/talk-transcript">Transcript: The title</a></p>
</figure>
```

The poster is optional on an embed and on Spotify or SoundCloud is usually left out. After the click the link is replaced by `<iframe src="{data-embed-src}" title="{data-embed-title}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin">`.

```tsx
import { Audio, Embed, Video } from "capsomer/react/player";

<Embed service="youtube" href={url} player={noCookieUrl} title="The title" action="Watch on YouTube" poster={pictureProps(attrs, { alt: "" }).img} />
```

## Exceptions in production

None yet.
