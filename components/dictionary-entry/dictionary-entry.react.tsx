import { useEffect, useRef, useState, type ReactNode } from "react";
import { listenLabel } from "./dictionary-entry.ts";
import { useHydrated } from "../hooks/hooks.react.tsx";

/** A plain string, or a word in another language as [lang, word], set in italics with its lang. */
export type EtymologyPart = string | [lang: string, word: string];

export interface DictionarySense {
  // The subject label before a specialized sense ("software"), set in italics with a period.
  label?: string | null;
  text: ReactNode;
}

export interface DictionaryEntryProps {
  // The word as it is spelled ("Almanac"); read by screen readers in lowercase.
  term: string;
  // The headword as it is shown, with its syllable dots ("al·ma·nac"); hidden from screen readers.
  syllables?: string;
  ipa?: string;
  respelling?: string;
  partOfSpeech: string;
  plural?: string[] | null;
  senses: DictionarySense[];
  etymology?: EtymologyPart[];
  // The clip. Without it there is no speaker.
  audio?: string;
  // The speaker's name. Default: "Listen to the pronunciation of {term}".
  listen?: string;
}

/** A speaker with two sound waves; the waves carry the playing state in CSS. */
export function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path
        className="cap-dictionary-entry-wave"
        d="M15 9.2a4 4 0 0 1 0 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        className="cap-dictionary-entry-wave"
        d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The speaker pair as React state: the link on the server and with script off, the button once
// mounted, the link again if the clip cannot load or play.
function Listen({ src, label }: { src: string; label: string }) {
  const mounted = useHydrated();
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const speaker = useRef<HTMLButtonElement>(null);
  const fellBack = useRef(false);

  useEffect(() => () => audio.current?.pause(), []);
  useEffect(() => {
    if (failed && fellBack.current) link.current?.focus();
  }, [failed]);

  const fail = () => {
    setPlaying(false);
    fellBack.current = document.activeElement === speaker.current;
    setFailed(true);
  };
  const clip = () => {
    if (audio.current) return audio.current;
    const created = new Audio();
    created.preload = "none";
    created.src = src;
    created.addEventListener("play", () => setPlaying(true));
    created.addEventListener("pause", () => setPlaying(false));
    created.addEventListener("ended", () => setPlaying(false));
    created.addEventListener("error", fail);
    audio.current = created;
    return created;
  };
  const onClick = () => {
    const player = clip();
    player.currentTime = 0;
    if (playing) {
      player.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    player.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return setPlaying(false);
      fail();
    });
  };
  const button = mounted && !failed;
  return (
    <>
      <a
        ref={link}
        className="cap-dictionary-entry-listen"
        href={src}
        data-cap-part="listen-link"
        aria-label={label}
        hidden={button}
      >
        <SpeakerIcon />
      </a>
      <button
        ref={speaker}
        type="button"
        className="cap-dictionary-entry-listen"
        data-cap-part="listen"
        data-src={src}
        aria-label={label}
        aria-pressed={playing}
        hidden={!button}
        onClick={onClick}
      >
        <SpeakerIcon />
      </button>
    </>
  );
}

// The HTML contract in dictionary-entry.md. A React page needs no enhance() call: the speaker is
// React state. Once hydrated the section carries data-cap-ready, set in an effect, so a later
// enhance() call skips it; server HTML that is never hydrated (an islands page) has none, so
// enhance() wires its speaker.
export function DictionaryEntry(props: DictionaryEntryProps) {
  const {
    term,
    syllables,
    ipa,
    respelling,
    partOfSpeech,
    plural,
    senses,
    etymology,
    audio,
    listen = listenLabel(term),
  } = props;
  const root = useRef<HTMLElement>(null);
  // React owns this one once it runs: a later enhance() call on the page leaves it alone.
  useEffect(() => {
    if (root.current) root.current.dataset.capReady = "";
  }, []);
  return (
    <section
      ref={root}
      className="cap-dictionary-entry"
      aria-label={`Dictionary entry: ${term}`}
      data-cap="dictionary-entry"
    >
      <p className="cap-dictionary-entry-head">
        <dfn className="cap-dictionary-entry-word">
          {syllables ? (
            <>
              <span className="cap-sr-only">{term.toLowerCase()}</span>
              <span aria-hidden="true">{syllables}</span>
            </>
          ) : (
            term
          )}
        </dfn>
        {ipa || respelling || audio ? (
          <span className="cap-dictionary-entry-pron">
            {ipa ? <span className="cap-dictionary-entry-ipa">{ipa}</span> : null}
            {respelling ? <span className="cap-dictionary-entry-respell">{respelling}</span> : null}
            {audio ? <Listen src={audio} label={listen} /> : null}
          </span>
        ) : null}
      </p>
      <p className="cap-dictionary-entry-pos">
        <i>{partOfSpeech}</i>
        {plural?.length ? (
          <>
            ; plural{" "}
            {plural.map((form, i) => (
              <span key={form}>
                {i > 0 ? " or " : null}
                <i>{form}</i>
              </span>
            ))}
          </>
        ) : null}
      </p>
      <ol className="cap-dictionary-entry-senses">
        {senses.map((sense, i) => (
          <li key={i}>
            {sense.label ? (
              <>
                <i className="cap-dictionary-entry-label">{sense.label}.</i>{" "}
              </>
            ) : null}
            {sense.text}
          </li>
        ))}
      </ol>
      {etymology?.length ? (
        <p className="cap-dictionary-entry-ety">
          <span className="cap-dictionary-entry-ety-label">Etymology</span>{" "}
          {etymology.map((part, i) =>
            typeof part === "string" ? (
              <span key={i}>{part}</span>
            ) : (
              <i key={i} lang={part[0]}>
                {part[1]}
              </i>
            ),
          )}
        </p>
      ) : null}
    </section>
  );
}
