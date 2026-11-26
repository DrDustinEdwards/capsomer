import { type ReactNode } from "react";
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
export declare function SpeakerIcon(): import("react").JSX.Element;
export declare function DictionaryEntry(props: DictionaryEntryProps): import("react").JSX.Element;
