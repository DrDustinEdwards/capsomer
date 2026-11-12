import { type ImageAttributes, type PictureProps } from "@dustinedwards/site-runtime/image";
export declare function Picture(props: {
    /** The image's own class: its size and fit. */
    className?: string;
    /** The page's one LCP image: eager, fetchpriority high. */
    priority?: boolean;
    /** Above the fold but not the LCP (the rest of a grid's first row): eager, at normal priority. */
    eager?: boolean;
} & ({
    attrs: ImageAttributes;
    alt: string;
} | {
    picture: PictureProps;
})): import("react").JSX.Element;
