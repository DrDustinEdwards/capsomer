import { ICONS, SOCIAL, type IconName, type SocialName } from "./icons.ts";

export { ICONS, SOCIAL, type IconName, type SocialName } from "./icons.ts";

// One icon. Hidden from assistive technology (the button or link around it carries the name), or,
// with `label`, an image named by it. A drawing the set lacks passes its own `d` (and `box` for a
// grid other than 24, as Carrel's 16-unit menu). In a button, `data-icon` says which side of the
// label it sits on, so the button pulls its padding in on that side (button.css).
export function Icon(
  props: { label?: string; className?: string; "data-icon"?: "start" | "end" } & (
    | { name: IconName | SocialName }
    | { d: string; box?: number; fill?: boolean }
  ),
) {
  const social = "name" in props && props.name in SOCIAL;
  const d =
    "name" in props
      ? social
        ? SOCIAL[props.name as SocialName]
        : ICONS[props.name as IconName]
      : props.d;
  const box = "box" in props && props.box ? props.box : 24;
  const fill = social || ("fill" in props && props.fill);
  return (
    <svg
      className={props.className ? `cap-icon ${props.className}` : "cap-icon"}
      viewBox={`0 0 ${box} ${box}`}
      data-fill={fill ? "" : undefined}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
      focusable="false"
      data-icon={props["data-icon"]}
    >
      <path d={d} />
    </svg>
  );
}
