import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

// The image attributes a poster takes: pictureProps(...).img from site-runtime fits.
export interface PosterProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export interface VideoProps {
  src: string;
  // The video's accessible name.
  title: string;
  // The site's own still, shown before play: with it the page downloads none of the video until asked.
  poster: string;
  // The video's own size, so the box holds its shape before the first frame.
  width: number;
  height: number;
  // Captions (WCAG 1.2.2). Leave out only for a video with no speech or sound that carries meaning.
  captions?: { src: string; lang?: string; label?: string };
  // A transcript, or a text alternative with what the picture shows (WCAG 1.2.3).
  transcript?: string;
  caption?: ReactNode;
  // "lazy" (the default): the poster and the video wait until the player nears the screen (loading="lazy", Chromium;
  // other browsers fetch the poster at once, as before). "eager" for a video at the top of a page, so its poster is
  // not held back (Modern Web Guidance, lazy-load-video-and-audio).
  loading?: "lazy" | "eager";
}

// The loading attribute on a media element, which React's types do not list yet. Eager is the browser's default, so
// it is left out.
const mediaLoading = (loading: "lazy" | "eager") =>
  (loading === "lazy" ? { loading: "lazy" } : {}) as Record<string, string>;

// A self-hosted video: the native player, its poster, captions, and nothing downloaded before play.
export function Video({
  src,
  title,
  poster,
  width,
  height,
  captions,
  transcript,
  caption,
  loading = "lazy",
}: VideoProps): ReactElement {
  return (
    <figure className="cap-player" data-kind="video">
      <video
        src={src}
        poster={poster}
        width={width}
        height={height}
        controls
        preload="none"
        {...mediaLoading(loading)}
        playsInline
        aria-label={title}
      >
        {captions ? (
          <track
            kind="captions"
            src={captions.src}
            srcLang={captions.lang ?? "en"}
            label={captions.label ?? "English"}
            default
          />
        ) : null}
      </video>
      {transcript ? (
        <p className="cap-player-transcript">
          <a href={transcript}>Transcript: {title}</a>
        </p>
      ) : null}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface AudioProps {
  src: string;
  title: string;
  // Required: a recording of speech needs its words in text (WCAG 1.2.1).
  transcript: string;
  caption?: ReactNode;
  // As for Video: "lazy" (the default) waits until the player nears the screen.
  loading?: "lazy" | "eager";
}

// An audio file: the native player, nothing downloaded before play, and its transcript one link away.
export function Audio({
  src,
  title,
  transcript,
  caption,
  loading = "lazy",
}: AudioProps): ReactElement {
  return (
    <figure className="cap-player" data-kind="audio">
      <audio src={src} controls preload="none" {...mediaLoading(loading)} aria-label={title} />
      <p className="cap-player-transcript">
        <a href={transcript}>Transcript: {title}</a>
      </p>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface EmbedProps {
  // The service's name in the markup ("youtube", "vimeo", "spotify", "soundcloud").
  service: string;
  // The page on the service: where the link goes with no script.
  href: string;
  // The player address the iframe loads after the click (the no-cookie host for YouTube).
  player: string;
  // What it shows; it names the player's iframe.
  title: string;
  // The service's verb and name: "Watch on YouTube", "Listen on Spotify".
  action: string;
  // The site's own poster, from its library. Never the service's thumbnail, which would call the service.
  poster?: PosterProps;
  caption?: ReactNode;
}

// An embed that makes no request to the service until the reader asks: a link with a poster and a play
// button, and the player in its place on a click. A click with a modifier stays a link.
export function Embed({
  service,
  href,
  player,
  title,
  action,
  poster,
  caption,
}: EmbedProps): ReactElement {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    // Focus follows the activation, so a keyboard reader lands in the player.
    if (playing) frame.current?.focus();
  }, [playing]);
  return (
    <figure className="cap-player" data-kind="embed" data-service={service}>
      {playing ? (
        <iframe
          ref={frame}
          src={player}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <a
          className="cap-player-facade"
          href={href}
          data-embed-src={player}
          data-embed-title={title}
          onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            setPlaying(true);
          }}
        >
          {poster ? (
            <img
              className="cap-player-poster"
              src={poster.src}
              srcSet={poster.srcSet}
              sizes={poster.sizes}
              width={poster.width}
              height={poster.height}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <span className="cap-player-play" aria-hidden="true" />
          <span className="cap-player-label">
            {action}: {title}
          </span>
        </a>
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

// The persistent audio player and its parts, each in its own file, all reached from here.
export { PlayerProvider, usePlayer } from "./player-context.react.tsx";
export type { PlayerApi, PlayerProviderProps, PlayerState } from "./player-context.react.tsx";
export {
  ChapterOptions,
  ChaptersControl,
  NextButton,
  PlayPauseButton,
  PlayTrackButton,
  PlayerStatus,
  Scrubber,
  SkipButton,
  SleepControl,
  SleepOptions,
  SpeedControl,
  SpeedOptions,
  TranscriptLink,
  VolumeControl,
} from "./player-controls.react.tsx";
export type { RenderLink } from "./player-controls.react.tsx";
export { DOCK_SHEET_BELOW, PlayerDock, PlayerSurface } from "./player-dock.react.tsx";
export type { PlayerDockProps, PlayerSurfaceProps } from "./player-dock.react.tsx";
export { PlayerTranscript } from "./player-transcript.react.tsx";
export type { PlayerTranscriptProps } from "./player-transcript.react.tsx";
export { Waveform, WaveformPreview } from "./player-waveform.react.tsx";
export type { WaveformPreviewProps, WaveformProps } from "./player-waveform.react.tsx";
export { ChapterList, Hosts, KeyMoments, PlayClip } from "./player-extras.react.tsx";
export type {
  ChapterListProps,
  HostsProps,
  KeyMoment,
  KeyMomentsProps,
  PlayClipProps,
  PlayerHost,
} from "./player-extras.react.tsx";
export type {
  PlayerArtwork,
  PlayerChapter,
  PlayerTrack,
  SleepMode,
  TranscriptCue,
} from "./player.ts";
