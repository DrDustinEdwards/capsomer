import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pictureProps, } from "@dustinedwards/site-runtime/image";
// One stored image as a <picture>: site-runtime's pictureProps written out in JSX, the same markup
// as its pictureHtml for a post body. AVIF and WebP sources over the <img>, the library's
// placeholder and main color in the image's own style while it loads (picture.css), lazy unless the
// page says otherwise. With no sources (an image the loader could not size) it is the <img> alone.
// The <picture> is display: contents (.cap-picture), so the <img> stays the box its parent lays out.
export function Picture(props) {
    const { sources, img } = "picture" in props
        ? props.picture
        : pictureProps(props.attrs, {
            alt: props.alt,
            priority: props.priority,
            className: props.className,
        });
    const loading = props.eager && !props.priority ? "eager" : img.loading;
    // The width and height attributes give the box its ratio. The style is the stored placeholder and
    // focal point only, the one style attribute a wrapper renders (picture.md says why).
    const image = (_jsx("img", { ...img, alt: img.alt, className: "picture" in props ? (props.className ?? img.className) : img.className, loading: loading, style: img.style }));
    if (sources.length === 0)
        return image;
    return (_jsxs("picture", { className: "cap-picture", children: [sources.map((source) => (_jsx("source", { ...source }, `${source.type} ${source.media ?? ""}`))), image] }));
}
