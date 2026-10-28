import { type HistoryEntry, type PersonRow, type TitleOption } from "./people-roles.ts";
export type { HistoryEntry, PersonRow, TitleOption };
export interface PeopleData {
    heading: string;
    lead?: string;
    people: PersonRow[];
    titles: TitleOption[];
    review?: {
        endDate: string;
        people: Array<Pick<PersonRow, "email" | "name" | "title" | "renewTo">>;
    };
    history?: {
        email: string;
        name: string;
        entries: HistoryEntry[];
    };
    changing?: string;
    result?: {
        ok: boolean;
        text: string;
    };
}
export interface PeopleRolesProps {
    data: PeopleData;
    action: string;
    now?: number;
    hrefFor?: (kind: "person" | "change", email: string) => string;
    closeHref?: string;
    onIntent?: (intent: string, fields: FormData) => void | Promise<void>;
    headingLevel?: 2 | 3;
}
export declare function PeopleRoles({ data, action, now, hrefFor, closeHref, onIntent, headingLevel }: PeopleRolesProps): import("react").JSX.Element;
