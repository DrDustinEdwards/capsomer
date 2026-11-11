---
name: dictionary-entry
title: Dictionary entry
summary: A word set as a dictionary sets it, between two rules, with its pronunciation and a speaker that plays the clip in place, its part of speech, numbered senses and its origin.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [default with the speaker as a button, playing, hover, keyboard focus, without script the speaker is a link, a clip that cannot play brings the link back, no clip and no etymology]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info, app/styles/dictionary-entry.css, app/components/dictionary-entry.tsx and app/enhance/pronounce.ts
replaces:
  - '\.term-(entry|head|word|pron|ipa|listen|senses|ety)\s*\{'
  - 'data-term-(entry|listen|audio-link)'
---

# Dictionary entry

A word set as a dictionary sets it: the headword with its syllable dots, the pronunciation in IPA and a respelling, a speaker that plays the clip, the part of speech and plural, numbered senses with a subject label before a specialized one, and the etymology in a quieter voice, between a heavy rule and a hairline. `.cap-dictionary-entry` from `capsomer/dictionary-entry.css`; the speaker is `enhance()` from `capsomer/behavior/dictionary-entry`, or `DictionaryEntry` from `capsomer/react/dictionary-entry`, which needs no call.

## When to use it

- A page about a word, or a page whose name is a word most readers rarely meet, that opens by saying what the word means.
- A glossary page for one term.

## When not to

- A list of terms and short definitions: a description list (`dl`) in prose, or the summary list.
- A recording someone listens to at length: the player.

## The default and its reason

- **The speaker is a link without script and a button with it.** The link opens the clip, which any browser plays; the button plays it in place. Both are the same round box, so the swap moves nothing.
- **Nothing plays until asked**, and the clip is fetched on the first press (`preload="none"`), not before.
- **A press plays, a second press stops**, and `aria-pressed` carries the state while it plays: the button fills with `--primary` and its waves pulse, except under reduced motion, where the fill alone says it.
- **A clip that cannot load or play brings the link back**, with focus on it if the button had it, so the reader still has a way to hear the word.
- **The headword is read as the word, not its syllables**: the dotted form is `aria-hidden` and a `.cap-sr-only` lowercase word stands beside it. The section is named "Dictionary entry: {term}".
- **The serif is `--prose`**, the respelling and the labels the interface face, so the entry reads as a printed dictionary in every family.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the speaker |
| Enter or Space on the speaker | Plays the clip; again stops it |
| Enter on the speaker link (no script) | Opens the clip |

## Accessibility

- The speaker is named "Listen to the pronunciation of {term}" (`listenLabel`), its icon `aria-hidden`; as a button it is a toggle (`aria-pressed`).
- Foreign words in the etymology carry their `lang`, so a screen reader pronounces them in their language.
- The speaker's hit area is at least `--target` and `--control`; under forced colors a playing speaker keeps a heavier edge in `Highlight`, since its fill is gone.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-dictionary-entry" aria-label="Dictionary entry: Almanac" data-cap="dictionary-entry">
  <p class="cap-dictionary-entry-head">
    <dfn class="cap-dictionary-entry-word"><span class="cap-sr-only">almanac</span><span aria-hidden="true">al·ma·nac</span></dfn>
    <span class="cap-dictionary-entry-pron">
      <span class="cap-dictionary-entry-ipa">/ˈɔːl.mə.næk/</span>
      <span class="cap-dictionary-entry-respell">AWL-muh-nak</span>
      <a class="cap-dictionary-entry-listen" href="/audio/almanac.mp3" data-cap-part="listen-link" aria-label="Listen to the pronunciation of Almanac"><svg aria-hidden="true">…</svg></a>
      <button type="button" class="cap-dictionary-entry-listen" data-cap-part="listen" data-src="/audio/almanac.mp3" aria-label="Listen to the pronunciation of Almanac" aria-pressed="false" hidden><svg aria-hidden="true">…</svg></button>
    </span>
  </p>
  <p class="cap-dictionary-entry-pos"><i>noun</i>; plural <i>almanacs</i></p>
  <ol class="cap-dictionary-entry-senses">
    <li>A yearly book of the calendar.</li>
    <li><i class="cap-dictionary-entry-label">publishing.</i> A yearly collection of facts on one subject.</li>
  </ol>
  <p class="cap-dictionary-entry-ety"><span class="cap-dictionary-entry-ety-label">Etymology</span> From Medieval Latin <i lang="la">almanach</i>.</p>
</section>
```

The speaker's SVG is a speaker with two waves, each wave `class="cap-dictionary-entry-wave"` (React exports it as `SpeakerIcon`). Call `enhance()` once on the page; `wireListen(button, link)` wires one pair on its own. `DictionaryEntry` rendered on the server and never hydrated (an islands page) is wired by `enhance()` too: React marks the entry `data-cap-ready` only once it runs, so a hydrated one is left to React.

```tsx
import { DictionaryEntry } from "capsomer/react/dictionary-entry";

<DictionaryEntry
  term="Almanac"
  syllables="al·ma·nac"
  ipa="/ˈɔːl.mə.næk/"
  respelling="AWL-muh-nak"
  partOfSpeech="noun"
  plural={["almanacs"]}
  senses={[{ text: "A yearly book of the calendar." }, { label: "publishing", text: "A yearly collection of facts on one subject." }]}
  etymology={["From Medieval Latin ", ["la", "almanach"], "."]}
  audio="/audio/almanac.mp3"
/>
```

## Exceptions in production

None yet.
