import type { Editor } from "@tiptap/core";
export declare function SuggestionsPanel({ editor, names, me, mayDecide, round, onRound, id, }: {
    /** The panel's id, unique on the page; its fields' ids start with it. */
    id?: string;
    editor: Editor | null;
    /** People by id, for whose a suggestion is. */
    names: Record<string, string>;
    me: number;
    /** Someone who may edit accepts and rejects; someone who suggests only withdraws their own. */
    mayDecide: boolean;
    /** The round new suggestions go in, or "" for none. */
    round: string;
    onRound: (round: string) => void;
}): import("react").JSX.Element;
