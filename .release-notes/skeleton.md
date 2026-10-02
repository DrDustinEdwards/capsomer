# Skeleton and spinner (new folder, moved out of Empty)

- `.cap-skeleton`, `.cap-skeleton-line`, `.cap-spinner`, `.cap-spinner-arc`, `.cap-spinner-label` keep their names and markup; their CSS moved from `empty.css` to `components/skeleton/skeleton.css` (`capsomer/skeleton.css`). Load it wherever you load `empty.css`. React: `capsomer/react/skeleton` (also still exported from `capsomer/react/empty`).
- New: `.cap-skeleton-block` (with `data-shape="circle|card"`), `.cap-spinner[data-size="sm|lg"]`, `.cap-spinner[data-layout="page"]` (React `<Spinner layout="page" />`, `role="status"`), `SkeletonBlock`.
- Look: the arc is `1.15em` (was 16 px); a skeleton line's height follows the text size; the radius is `--radius-m`.
- `.cap-btn-spinner` (the button's own ring) is unchanged and does not depend on this CSS.
