import { type ReactNode } from "react";
/** A plain string, or a word in another language as [lang, word], set in italics with its lang. */
export type EtymologyPart = string | [lang: string, word: string];
export interface DictionarySense {
    label?: string | null;
    text: ReactNode;
}
export interface DictionaryEntryProps {
    term: string;
    syllables?: string;
    ipa?: string;
    respelling?: string;
    partOfSpeech: string;
    plural?: string[] | null;
    senses: DictionarySense[];
    etymology?: EtymologyPart[];
    audio?: string;
    listen?: string;
}
/** A speaker with two sound waves; the waves carry the playing state in CSS. */
export declare function SpeakerIcon(): import("react").JSX.Element;
export declare function DictionaryEntry(props: DictionaryEntryProps): import("react").JSX.Element;
