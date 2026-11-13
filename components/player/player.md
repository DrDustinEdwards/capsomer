---
name: player
title: Player
summary: Video, audio and embeds from a video or audio service, the same on a JSX page and in a post; the persistent audio player that keeps playing across pages, with its dock, surface, waveform, chapters and synced transcript; and the inline audio button for a short clip in running text.
parts: [css, behavior, react]
tool: native + own JavaScript + React
states: [embed with a poster, embed with no poster, audio embed, embed after a click, video, audio, dock loaded and paused, dock on a phone with its sheet, dock hidden while the surface is on screen, surface, surface with no stored peaks, chapter playing, key moments, hosts, transcript following, transcript searched, editor waveform, editor waveform empty, inline audio button, inline audio button playing]
added: 0.56.0
updated: 0.92.0
source: Prelum's :::video, :::audio and ::embed (render-blocks.mjs) and render/enhance's click-to-load; Capsomer's prose blocks, which styled the first embed card; germomics' persistent player (player-context.tsx, PlayerDock.tsx, controls.tsx, EpisodePlayerSurface.tsx, TranscriptPanel.tsx, EpisodeExtras.tsx, Waveform.tsx, EpisodeWaveform.tsx, lib/player-storage.ts, lib/peaks.ts, lib/waveform-client.ts); dustinedwards.info's pronunciation button (enhance/pronounce.ts, dictionary-entry.css)
replaces:
  - '\.(video-facade|embed-facade|lite-youtube|yt-facade|podcast-player)\s*\{'
  - "<iframe[^>]+(youtube|vimeo|spotify|soundcloud)"
  - "export function (PlayerProvider|PlayerDock|EpisodePlayerSurface|TranscriptPanel)\\b"
  - "new MediaMetadata\\("
  - "--player-h\\b"
  - "data-term-listen"
  - "\\.term-listen\\b"
  - "export function computePeaks\\("
---

# Player

## Usage

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
  <video src="/media/demo.mp4" poster="/media/demo-poster.jpg?w=1408" width="1280" height="720" controls preload="none" loading="lazy" playsinline aria-label="The title">
    <track kind="captions" src="/media/demo.vtt" srclang="en" label="English" default>
  </video>
  <p class="cap-player-transcript"><a href="/writing/demo-transcript">Transcript: The title</a></p>
  <figcaption>…</figcaption>
</figure>

<figure class="cap-player" data-kind="audio">
  <audio src="/media/talk.mp3" controls preload="none" loading="lazy" aria-label="The title"></audio>
  <p class="cap-player-transcript"><a href="/writing/talk-transcript">Transcript: The title</a></p>
</figure>
```

```tsx
import { Audio, Embed, Video } from "capsomer/react/player";

<Embed service="youtube" href={url} player={noCookieUrl} title="The title" action="Watch on YouTube" poster={pictureProps(attrs, { alt: "" }).img} />
```

```tsx
import { PlayerDock, PlayerProvider, PlayerSurface, PlayerTranscript, ChapterList } from "capsomer/react/player";

<PlayerProvider storagePrefix="example-" artist="Example Show" artwork={[{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }]} noun="episode">
  <Outlet />
  <PlayerDock renderLink={routerRenderLink} />
</PlayerProvider>
```

```tsx
import { PlayerProvider, usePlayer } from "capsomer/react/player-context";
const PlayerDock = lazy(() => import("capsomer/react/player").then(({ PlayerDock }) => ({ default: PlayerDock })));
function Dock() {
  if (!usePlayer().current) return null;
  return <Suspense fallback={null}><PlayerDock renderLink={routerRenderLink} /></Suspense>;
}

const track = { id: 12, title: "Getting started", src: "/media/ep12.mp3", album: "Episode 12", chapters, href: "/getting-started", transcript: "/getting-started#transcript", duration: 1834 };
<PlayerSurface track={track} peaks={peaks} transcriptHref="#transcript" />
<ChapterList track={track} />
<PlayerTranscript cues={cues} track={track} shareUrl={(t) => `https://example.com/getting-started?t=${t}`} attribution={(title, url) => `From "${title}" on Example Show: ${url}`} />
```

```html
<span class="cap-player-clip" data-cap="player" data-kind="clip">
  <a class="cap-player-clip-link" href="/media/capsomer.mp3" aria-label="Hear how Capsomer is pronounced"><svg aria-hidden="true">…</svg></a>
  <button type="button" class="cap-player-clip-button" data-src="/media/capsomer.mp3" aria-label="Hear how Capsomer is pronounced" aria-pressed="false" hidden><svg aria-hidden="true">…</svg></button>
</span>
```

```ts
import { enhance } from "capsomer/behavior/player";
enhance();
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the embed, the player's own controls and the transcript link |
| Enter on an embed | Puts the player in its place and moves focus into it |

| Key | Does |
| --- | --- |
| Tab | Reaches each control in order; the dock's controls are skipped while it is hidden |
| Enter or Space on a control | Plays or pauses, skips, opens a setting, presses a chapter, a key moment or a transcript line |
| Arrow keys on the scrubber | Back or forward 5 seconds; with Shift, 15 |
| Page Up, Page Down on the scrubber | Forward or back a minute |
| Home, End on the scrubber | To the start, to the end |
| Arrow keys in a setting | Choose the speed or the sleep timer (radios), move through a menu |
| Esc | Closes a popover, a menu or the sheet; focus returns to its button |
| Enter or Space on the inline audio button | Plays the clip; again, stops it |

- The embed is a link named by the service and the title; the play button and the poster are decoration (`aria-hidden`, `alt=""`). The player's iframe is named by the title.
- The video and audio are named by their title (`aria-label`); captions and transcripts are WCAG 1.2.1 to 1.2.3.
- Nothing plays by itself; the service's autoplay starts only after the reader's own click.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

- Play and pause change the button's name ("Play", "Pause") and carry no `aria-pressed` (APG Button: one or the other). A listing's `PlayTrackButton` names the track and does carry `aria-pressed`, as germomics' did.
- The scrubber is a native range with `aria-valuetext` ("1 minute 5 seconds of 2 minutes"); the waveform never is the only way to seek.
- Speed and sleep are radios in a fieldset in the sheet and the speed popover (one tab stop, arrows choose); in the dock and on the surface, sleep and chapters are the shared menu's radio items.
- The player's state is said politely ("Playing, Field notes", "Buffering", "Error loading audio") from one live region, outside the hidden dock.
- The chapter playing, the key moment playing and the transcript line playing are `aria-current`, with an edge, weight or tint beside the color; forced colors keep a system color or an outline.
- Volume is left out under a coarse pointer: phones have their own buttons and iOS ignores a page's volume (MDN, HTMLMediaElement.volume).
- The inline audio button is named by its `label` ("Hear how Capsomer is pronounced") and carries `aria-pressed`.
