# Detail panel (rebuilt on the shared dialog)

- Markup: add `cap-dialog` to the `<dialog class="cap-detail">`, and `data-placement="right" data-size="md"`. Replace `.cap-detail-head` with `<div class="cap-dialog-header" data-divider>` holding `.cap-detail-heading`; the title is now `class="cap-dialog-title"` (was `cap-detail-title`) inside a new `.cap-detail-titlerow` (put the status pill beside it there). The body is `<div class="cap-dialog-body cap-detail-body">`.
- The Close button moves to the end of the dialog and becomes the shared corner icon button (`class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only data-cap-part="close" aria-label="Close"`); the word "Close" in the header is gone.
- `data-cap-history` should now read `data-cap-history="detail"` to keep the address `#detail-<id>` (an empty value is treated as `detail` for a panel, so existing markup still works).
- Focus on open is the first control in the panel (Close only when it has none), not always Close.
- Width: 35rem, at most 85% of the window (was 560 px, full width on a phone).
- CSS: `.cap-detail`, `.cap-detail-head` and `.cap-detail-title` rules are gone (the shared dialog's); load `dialog.css`. `.cap-detail-heading`, `-kind`, `-id`, `-body`, `-section`, `-cmd`, `-record`, `-controls`, `-copied`, `-source` and `-diff` are unchanged.
- Code: `enhance`, `openDetail`, `closeDetail`, `wireDetail`, `copyFrom`, `detailHash` keep their signatures. React: `DetailPanel` renders the shared `Dialog` (its element has `data-cap="dialog"`).
