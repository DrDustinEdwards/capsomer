# Tooltip (the shared popover's tooltip variant)

- Markup: the tip element is now `class="cap-popover" data-variant="tooltip"` (was `class="cap-tip"`), with `popover="manual" role="tooltip"` as before; add `data-cap="tooltip"` and optionally `data-side="top|bottom|left|right"` and `<span class="cap-popover-arrow" aria-hidden="true"></span>`. Triggers are unchanged (`data-cap-tip="<id>"`). `enhance()` and `attach()` add the `cap-popover` class and `data-variant` to a 0.1 `.cap-tip`, so old markup keeps working once `popover.css` is loaded.
- CSS: `.cap-tip` rules (and the `--cap-tip-top` and `--cap-tip-left` custom properties) are gone; load `popover.css`. `tooltip.css` is now empty of rules.
- Default side is above the trigger (it was below); set `data-side="bottom"` to keep the old place.
- Behaviour: focus opens a tip only for keyboard focus (`:focus-visible`), touch never opens one, a press on the trigger hides it, and a second tip opens at once while one is open or just closed (400 ms).
- Code: `attach`, `enhance`, `showTip`, `hideTip`, `place`, `supportsAnchor`, `SHOW_DELAY_MS` and `HIDE_GRACE_MS` keep their names; `place` and the constants are now the popover's. React: `Tooltip` keeps `tip` and the render-prop `children`; new optional `side`, `align` and `arrow` (the arrow is on by default).
