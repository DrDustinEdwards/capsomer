---
name: player
title: Player
summary: Video, audio and embeds from a video or audio service, the same on a JSX page and in a post; the persistent audio player that keeps playing across pages, with its dock, surface, waveform, chapters and synced transcript; and the inline audio button for a short clip in running text. An embed loads nothing from the service until the reader asks.
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
- **A player below the fold waits** (`loading="lazy"`, the default; Chromium): its poster is not fetched until it nears the screen. A video at the top of the page passes `loading="eager"` so its poster comes at once (Modern Web Guidance, lazy-load-video-and-audio).
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
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

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

The poster is optional on an embed and on Spotify or SoundCloud is usually left out. After the click the link is replaced by `<iframe src="{data-embed-src}" title="{data-embed-title}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin">`.

```tsx
import { Audio, Embed, Video } from "capsomer/react/player";

<Embed service="youtube" href={url} player={noCookieUrl} title="The title" action="Watch on YouTube" poster={pictureProps(attrs, { alt: "" }).img} />
```

## The persistent audio player

A site with episodes or recordings keeps one `<audio>` element playing while the reader moves between pages. `PlayerProvider` sits once above the router's outlet and renders it; every part below reads it through `usePlayer()`.

- **What it does.** A queue (`setQueue` seeds one without playing; `playQueueAt` starts it; `next`, `prev`; previous restarts a track past its third second), play and pause, `seek`, skip back 15 and forward 30 seconds, a rate from 0.5 to 3 (presets and a fine range), volume and mute, a sleep timer by minutes or at the end of the track, buffering and error states, and `dismiss`, which ends the session (the dock goes and does not come back on scroll).
- **What it remembers**, in localStorage under the site's `storagePrefix`: the rate, the volume, mute, and each track's position, saved every five seconds and never resumed inside its last five (`playerStorage(prefix)` in `capsomer/behavior/player`; every read and write in try/catch).
- **Media Session**: metadata with `chapterInfo`, the track's artwork or the provider's `artwork`, the position (`setPositionState`), every action handler (play, pause, stop, previous, next, seek backward and forward with the browser's offset, seek to with fast seek) and `playbackState`. The handlers are cleared on every change so a stale one never fires (W3C Media Session).
- **Nothing loads before a reader asks.** The element is `preload="none"` until a track is picked, then `metadata`. No autoplay.
- **A press before React.** A page that hydrates on intent starts the press in the press itself, since Safari and iOS refuse a later `play()`: `startTrack(audio, track, storage)` on `document.querySelector(AUDIO_SELECTOR)`, with the remembered rate, volume and mute. The provider adopts that element as it is (`STARTED_ATTRIBUTE`), with no reload and no seek.

**The dock** (`PlayerDock`): the scrubber with chapter ticks, the title (a link to `track.href` through `renderLink`), the chapter playing or the status, back, play, forward, next, and the settings (speed, volume, sleep, chapters) in popovers and menus. It measures its height into `--cap-player-dock-h` on `<html>`; `player.css` pads the body and the scroll by it, so the footer and an anchor always clear it. Under 48rem of width the settings move into a bottom sheet (the dialog, `placement="bottom"`) behind More. While the loaded track's own surface is on screen it is faded, `inert` and `aria-hidden`, still playing; the polite status stays outside it.

**The surface** (`PlayerSurface`): the player on a track's page, a waveform (pointer only, `aria-hidden`; the scrubber is the seek control, WCAG 2.5.7) over the scrubber, then play, back, forward and the settings. It acts on its own track without taking over another that is playing, and tells the provider when it is on screen.

**The transcript** (`PlayerTranscript`): takes cues already parsed (Prelum's WebVTT parser) with their `speaker` and `nonVerbal`, groups them into paragraphs, and follows the browser's own TextTrack (a hidden metadata track on the player's element, `cuechange`). A press on a cue plays from there. The active cue scrolls into view inside the box, never the page, and only while the box is on screen; a reader who scrolls away gets Jump to current. Search filters it; Copy with link copies the selection with `attribution(title, shareUrl(seconds))`.

**Around it**: `ChapterList`, `KeyMoments` (a jump says where it went in a status line under the list, not a toast), `Hosts` (the shared avatar, or the site's own `avatar`), `PlayTrackButton` for listings, and `WaveformPreview` for an editor. Peaks are computed once, at upload: `computePeaks(channels)` (plain, for a Node script too) or `decodePeaks(arrayBuffer)` in the browser; the stored contract is 400 integers from 0 to 100.

## The inline audio button

A small speaker inside running text that plays a short clip, a pronunciation. With no script it is a link to the clip; `enhance()` shows the button, which plays in place on a press, carries `aria-pressed` while it plays and stops on a second press. Nothing is fetched before the first press. A clip that cannot load or play brings the link back.

## Keyboard (the audio player)

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

## Accessibility (the audio player)

- Play and pause change the button's name ("Play", "Pause") and carry no `aria-pressed` (APG Button: one or the other). A listing's `PlayTrackButton` names the track and does carry `aria-pressed`, as germomics' did.
- The scrubber is a native range with `aria-valuetext` ("1 minute 5 seconds of 2 minutes"); the waveform never is the only way to seek.
- Speed and sleep are radios in a fieldset in the sheet and the speed popover (one tab stop, arrows choose); in the dock and on the surface, sleep and chapters are the shared menu's radio items.
- The player's state is said politely ("Playing, Field notes", "Buffering", "Error loading audio") from one live region, outside the hidden dock.
- The chapter playing, the key moment playing and the transcript line playing are `aria-current`, with an edge, weight or tint beside the color; forced colors keep a system color or an outline.
- Volume is left out under a coarse pointer: phones have their own buttons and iOS ignores a page's volume (MDN, HTMLMediaElement.volume).
- The inline audio button is named by its `label` ("Hear how Capsomer is pronounced") and carries `aria-pressed`.

## Markup (the audio player)

```tsx
import { PlayerDock, PlayerProvider, PlayerSurface, PlayerTranscript, ChapterList } from "capsomer/react/player";

<PlayerProvider storagePrefix="example-" artist="Example Show" artwork={[{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }]} noun="episode">
  <Outlet />
  <PlayerDock renderLink={routerRenderLink} />
</PlayerProvider>

const track = { id: 12, title: "Getting started", src: "/media/ep12.mp3", album: "Episode 12", chapters, href: "/getting-started", transcript: "/getting-started#transcript", duration: 1834 };
<PlayerSurface track={track} peaks={peaks} transcriptHref="#transcript" />
<ChapterList track={track} />
<PlayerTranscript cues={cues} track={track} shareUrl={(t) => `https://example.com/getting-started?t=${t}`} attribution={(title, url) => `From "${title}" on Example Show: ${url}`} />
```

The dock renders `div.cap-player-dock[role=region]` > `.cap-player-dock-inner` > `.cap-player-scrubber` and `.cap-player-dock-row` (`.cap-player-now` with `.cap-player-title` and `.cap-player-meta`, `.cap-player-transport`, `.cap-player-settings`, `.cap-player-more`, the close button); the sheet is `dialog.cap-dialog.cap-player-sheet`. Controls are `button.cap-player-btn` with `data-part` (`play`, `skip`, `next`, `setting`, `close`), `data-active` when a setting is off its default, and `data-size="lg"` on the surface's play button.

The inline audio button, as the server writes it:

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

React: `<PlayClip src="/media/capsomer.mp3" label="Hear how Capsomer is pronounced" />` renders the same and enhances itself; playing is the element's own state, as a popover's open state is.

## A site's own look

A site that keeps its own look maps the family's tokens on the player's classes (`.cap-player-dock, .cap-player-surface, .cap-player-sheet, .cap-player-transcript, .cap-player-list, .cap-player-wave, .cap-player-wave-preview, .cap-player-clip`): `--surface`, `--raised`, `--sunken`, `--line`, `--line-strong`, `--text`, `--muted`, `--dim`, `--accent`, `--accent-text`, `--accent-soft`, `--primary`, `--primary-hover`, `--primary-line`, `--primary-fg`, `--crit`, `--ground`, and four of its own: `--cap-player-face` (titles, the UI face by default), `--cap-player-meta-face` (times and the status line, the mono face), `--cap-player-btn` (a control's size, `max(var(--control), var(--target))`) and `--cap-player-btn-lg`.

## Deliberately different from the site copies

- **The sheet is the dialog**, not a hand focus trap: the top layer, Esc, the backdrop, the grab bar and focus back to More come with it.
- **Settings are the shared popover and menu**, not a hand popover: sleep and chapters are menu radio items; speed and volume are popovers, because a range cannot sit in a menu.
- **The transcript search has a visible label** (the shared search field), not a placeholder.
- **A key moment's jump is said under the list**, not in a floating toast (DEFAULTS, messages).
- **Mute is remembered** as well as the volume.
- **The end of the queue stops.** germomics' copy called next at the last track's end, which started that track over.
- **The truncated dock title has no `title` tooltip**: the link takes the shared link props.

## Exceptions in production

None yet.
