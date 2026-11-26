import { pictureProps, type ImageAttributes } from "@dustinedwards/site-runtime/image";
type PictureProps = ReturnType<typeof pictureProps>;
export declare function Picture(props: {
    className?: string;
    priority?: boolean;
    eager?: boolean;
} & ({
    attrs: ImageAttributes;
    alt: string;
} | {
    picture: PictureProps;
})): import("react").JSX.Element;
export {};
