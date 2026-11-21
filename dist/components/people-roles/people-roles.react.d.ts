import { type HistoryEntry, type PersonRow, type RoleGridPerson, type RoleOption, type RoleScope, type TitleOption } from "./people-roles.ts";
export type { HistoryEntry, PersonRow, RoleGridPerson, RoleOption, RoleScope, TitleOption };
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
export declare function PeopleRoles({ data, action, now: nowProp, hrefFor, closeHref, onIntent, headingLevel, }: PeopleRolesProps): import("react").JSX.Element;
export interface RoleGridProps {
    people: RoleGridPerson[];
    scopes: RoleScope[];
    caption: string;
    personHeading?: string;
    options: (person: RoleGridPerson, scope: RoleScope) => RoleOption[];
    onRoleChange?: (person: RoleGridPerson, scope: RoleScope, role: string) => void | Promise<void>;
    onAccess?: (person: RoleGridPerson, intent: "disable" | "enable") => void | Promise<void>;
    action?: string;
    noAccess?: string;
}
export declare function RoleGrid({ people, scopes, caption, personHeading, noAccess, ...rest }: RoleGridProps): import("react").JSX.Element;
