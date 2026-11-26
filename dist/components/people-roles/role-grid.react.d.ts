import { type RoleGridPerson, type RoleOption, type RoleScope } from "./people-roles.ts";
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
