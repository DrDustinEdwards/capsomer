import { IconPath } from "./icon-path.react.tsx";
import { ICONS, SOCIAL, type IconName, type SocialName } from "./icons.ts";

export { ICONS, SOCIAL, type IconName, type SocialName } from "./icons.ts";

// One icon. Hidden from assistive technology (the button or link around it carries the name), or,
// with `label`, an image named by it. A drawing the set lacks passes its own `d` (and `box` for a
// grid other than 24, as Carrel's 16-unit menu); an app that only does that imports IconPath from
// `capsomer/react/icon-path`, which leaves the set out of its bundle.
export function Icon(
  props: { label?: string; className?: string } & (
    | { name: IconName | SocialName }
    | { d: string; box?: number; fill?: boolean }
  ),
) {
  if (!("name" in props)) return <IconPath {...props} />;
  const social = props.name in SOCIAL;
  return (
    <IconPath
      d={social ? SOCIAL[props.name as SocialName] : ICONS[props.name as IconName]}
      fill={social}
      label={props.label}
      className={props.className}
    />
  );
}
