# Empty

- `.cap-skeleton`, `.cap-spinner` and their parts moved to `components/skeleton` (`capsomer/skeleton.css`, `capsomer/react/skeleton`). Class names and markup are unchanged. An app that loads only `empty.css` must also load `skeleton.css` (the long wait and every spinner need it). `capsomer/react/empty` still exports `Skeleton` and `Spinner`.
- `.cap-empty` is now centred, with a dashed edge and `--pad-card` padding (was left-aligned, no edge). Add `data-flush` where it sits inside a panel or table that already has an edge. Its action is centred under the words.
- New parts: `.cap-empty-header`, `.cap-empty-media[data-variant="icon"]`, `.cap-empty-content`. The 0.1 markup (title, text, button as direct children) still works. React `Empty` renders the header and content parts and takes `icon` and `flush`.
