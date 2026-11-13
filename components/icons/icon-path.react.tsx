// One icon drawn from its own path, without the set: `capsomer/react/icon-path`, the light entry
// for an app that draws only its own glyphs (Carrel's menu). `Icon` (icons.react.tsx) looks a name
// up in ICONS and draws it with this, so an app that imports only IconPath ships none of the set.
// Hidden from assistive technology, or, with `label`, an image named by it.
export function IconPath(props: {
  d: string;
  box?: number;
  fill?: boolean;
  label?: string;
  className?: string;
}) {
  const box = props.box || 24;
  return (
    <svg
      className={props.className ? `cap-icon ${props.className}` : "cap-icon"}
      viewBox={`0 0 ${box} ${box}`}
      data-fill={props.fill ? "" : undefined}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
      focusable="false"
    >
      <path d={props.d} />
    </svg>
  );
}
