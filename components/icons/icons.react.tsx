export * from "./icons.ts";

// One icon, drawn from its path: `<Icon d={iconSearch} />`, a social mark `<Icon {...markX} />`, or a
// drawing the set lacks (`box` for a grid other than 24, as Carrel's 16-unit menu). Each drawing is
// its own export of icons.ts, so an app's bundle holds only the ones it imports. Hidden from
// assistive technology (the button or link around it carries the name), or, with `label`, an image
// named by it.
export function Icon(props: {
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
