# popover (new in 0.2.0)

- New block `components/popover`: `.cap-popover` surface, `capsomer/behaviour/popover`, `capsomer/react/popover`. Nothing on 0.1 had it, so nothing breaks.
- `tooltip` is untouched in this release and keeps working (`.cap-tip`, `data-cap-tip`). It will be rebuilt on this block; an app on 0.1 will then change `class="cap-tip"` to `class="cap-popover" data-variant="tooltip"` and `data-cap-tip` triggers to the `[data-cap="popover"]` wrapper.
- Apps that restyle Base UI popups (combobox, menu) can add `class="cap-popover"` to the popup and `data-flush` when the popup pads its own items.
