// The React specimens: the Embed (the poster and play button, then the player in place on a click;
// the player address is a blank page, so the specimen calls no service), and the persistent audio
// player: the dock, a track's surface with its waveform, chapters, key moments, hosts and
// transcript, and the editor's still waveform. The audio is a quiet tone made in the page.
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ChapterList,
  Embed,
  Hosts,
  KeyMoments,
  PlayerDock,
  PlayerProvider,
  PlayerSurface,
  PlayerTranscript,
  WaveformPreview,
  usePlayer,
  type PlayerTrack,
  type TranscriptCue,
} from "./player.react.tsx";
import { toneUrl } from "./specimen/tone.ts";

const mount = (name: string) => document.querySelector<HTMLElement>(`[data-mount='${name}']`);

const embed = mount("embed");
if (embed) {
  createRoot(embed).render(
    <Embed
      service="youtube"
      href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      player="about:blank"
      title="A keynote on publishing with Prelum"
      action="Watch on YouTube"
      poster={{
        src: new URL("./specimen/poster.svg", import.meta.url).href,
        width: 1280,
        height: 720,
      }}
    />,
  );
}

const peaks = Array.from({ length: 400 }, (_, i) =>
  Math.round(40 + 30 * Math.sin(i / 9) + 25 * Math.sin(i / 3.7) * Math.cos(i / 41)),
);

const chapters = [
  { title: "Getting started", start: 0 },
  { title: "Field notes", start: 40 },
  { title: "Release notes", start: 85 },
];

const tracks = (): PlayerTrack[] => [
  {
    id: "sample-12",
    title: "Episode 12: Getting started with shared site code",
    src: toneUrl(120),
    album: "Episode 12",
    chapters,
    href: "#episode-12",
    transcript: "#transcript",
    duration: 120,
  },
  {
    id: "sample-13",
    title: "Episode 13: Field notes from a release",
    src: toneUrl(90, 260),
    album: "Episode 13",
    href: "#episode-13",
    duration: 90,
  },
];

const cues: TranscriptCue[] = [
  {
    start: 0,
    end: 6,
    text: "Welcome back. Today we are getting started with shared site code.",
    speaker: "Alex Rivera",
  },
  {
    start: 6,
    end: 14,
    text: "Every site behaves the same, and each keeps its own look.",
    speaker: "Alex Rivera",
  },
  { start: 17, end: 19, text: "[music]", nonVerbal: true },
  {
    start: 30,
    end: 38,
    text: "The first thing we moved was the player, so playback survives a page change.",
    speaker: "Sam Lee",
  },
  {
    start: 40,
    end: 50,
    text: "Field notes: the dock measures itself, so the footer always clears it.",
    speaker: "Sam Lee",
  },
  {
    start: 54,
    end: 66,
    text: "And the transcript follows the browser's own text track.",
    speaker: "Jordan Park",
  },
  {
    start: 85,
    end: 96,
    text: "Release notes come last. Thanks for listening.",
    speaker: "Alex Rivera",
  },
];

const hosts = [
  { name: "Alex Rivera", role: "Host", href: "https://example.com/alex" },
  { name: "Sam Lee", role: "Producer" },
];

// Loads the first track, paused, as a reader who pressed play and then pause would leave it.
function Loaded({ list }: { list: PlayerTrack[] }) {
  const p = usePlayer();
  useEffect(() => {
    p.playQueueAt(list, 0);
    p.pause();
    // oxlint-disable-next-line react/exhaustive-deps -- loads once, on mount
  }, []);
  return null;
}

const dock = mount("dock");
if (dock) {
  const list = tracks();
  createRoot(dock).render(
    <PlayerProvider storagePrefix="cap-specimen-" artist="Example Show" noun="episode">
      <main className="player-sample-page">
        <h1>A page with the dock</h1>
        <p>The dock stays while the reader moves between pages. Narrow the frame to see More.</p>
      </main>
      <Loaded list={list} />
      <PlayerDock />
    </PlayerProvider>,
  );
}

const surface = mount("surface");
if (surface) {
  const list = tracks();
  const track = list[0] as PlayerTrack;
  createRoot(surface).render(
    <PlayerProvider storagePrefix="cap-specimen-" artist="Example Show" noun="episode">
      <main className="player-sample-page">
        <h1>{track.title}</h1>
        <div id="player">
          <PlayerSurface track={track} peaks={peaks} transcriptHref="#transcript" />
        </div>
        <KeyMoments
          track={track}
          playerId="player"
          moments={[
            { seconds: 30, label: "Why the player moved first" },
            { seconds: 54, label: "Following the text track" },
          ]}
        />
        <ChapterList track={track} />
        <Hosts hosts={hosts} />
        <section id="transcript" aria-labelledby="transcript-h">
          <h2 id="transcript-h">Transcript</h2>
          <PlayerTranscript
            cues={cues}
            track={track}
            shareUrl={(t) => `https://example.com/episodes/12?t=${t}`}
            attribution={(title, url) => `From "${title}" on Example Show: ${url}`}
          />
        </section>
        <p className="player-sample-tail">
          The end of the page: scroll here and the dock comes back.
        </p>
      </main>
      <PlayerDock />
    </PlayerProvider>,
  );
}

const preview = mount("preview");
if (preview) {
  createRoot(preview).render(
    <>
      <WaveformPreview peaks={peaks} markers={[40 / 120, 85 / 120]} label="Episode 12 waveform" />
      <WaveformPreview peaks={[]} />
    </>,
  );
}

const standin = mount("standin");
if (standin) {
  const track = { ...(tracks()[1] as PlayerTrack), title: "Episode 13: no stored peaks yet" };
  createRoot(standin).render(
    <PlayerProvider storagePrefix="cap-specimen-standin-">
      <PlayerSurface track={track} peaks={null} />
    </PlayerProvider>,
  );
}
