import { pictureProps, type ImageAttributes } from "@dustinedwards/site-runtime/image";

type PictureProps = ReturnType<typeof pictureProps>;

// One stored image as a <picture>: site-runtime's pictureProps in JSX, the same markup as its
// pictureHtml for a post body. AVIF and WebP sources over the <img>, the placeholder and main color in
// the image's own style while it loads (picture.css), lazy unless the page says otherwise. The
// <picture> is display: contents (.cap-picture), so the <img> stays the box its parent lays out.
export function Picture(
  props: {
    className?: string;
    priority?: boolean;
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
