import { type TitleOption } from "./people-roles.ts";
export declare function Hidden({ fields }: {
    fields: Record<string, string>;
}): import("react").JSX.Element;
export declare function AddForm({ id, Sub, titles, action, }: {
    id: string;
    Sub: "h3" | "h4";
    titles: TitleOption[];
    action: string;
}): import("react").JSX.Element;
