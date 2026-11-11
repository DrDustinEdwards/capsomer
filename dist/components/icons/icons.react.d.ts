import { type IconName, type SocialName } from "./icons.ts";
export { ICONS, SOCIAL, type IconName, type SocialName } from "./icons.ts";
export declare function Icon(props: {
    label?: string;
    className?: string;
} & ({
    name: IconName | SocialName;
} | {
    d: string;
    box?: number;
    fill?: boolean;
})): import("react").JSX.Element;
