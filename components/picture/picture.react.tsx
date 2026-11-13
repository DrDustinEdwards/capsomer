import {
  pictureProps,
  type ImageAttributes,
  type PictureProps,
} from "@dustinedwards/site-runtime/image";

// One stored image as a <picture>: site-runtime's pictureProps written out in JSX, the same markup
// as its pictureHtml for a post body. AVIF and WebP sources over the <img>, the library's
// placeholder and main color in the image's own style while it loads (picture.css), lazy unless the
// page says otherwise. With no sources (an image the loader could not size) it is the <img> alone.
// The <picture> is display: contents (.cap-picture), so the <img> stays the box its parent lays out.
export function Picture(
  props: {
    /** The image's own class: its size and fit. */
    className?: string;
    /** The page's one LCP image: eager, fetchpriority high. */
    priority?: boolean;
    /** Above the fold but not the LCP (the rest of a grid's first row): eager, at normal priority. */
    eager?: boolean;
  } & ({ attrs: ImageAttributes; alt: string } | { picture: PictureProps }),
) {
  const { sources, img } =
    "picture" in props
      ? props.picture
      : pictureProps(props.attrs, {
          alt: props.alt,
          priority: props.priority,
          className: props.className,
        });
  const loading = props.eager && !props.priority ? "eager" : img.loading;
  // The width and height attributes give the box its ratio. The style is the stored placeholder and
  // focal point only, the one style attribute a wrapper renders (picture.md says why).
  const image = (
    <img
      {...img}
      alt={img.alt}
      className={"picture" in props ? (props.className ?? img.className) : img.className}
      loading={loading}
      style={img.style}
    />
  );
  if (sources.length === 0) return image;
  return (
    <picture className="cap-picture">
      {sources.map((source) => (
        <source key={`${source.type} ${source.media ?? ""}`} {...source} />
      ))}
      {image}
    </picture>
  );
}
