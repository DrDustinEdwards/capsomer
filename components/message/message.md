---
name: message
title: Message
summary: The page's one status region for action results and warnings, never taking focus.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [empty, plain message, message with Undo, after Undo, warning that stays, warning through the next result, failure, Undo that could not run, clears itself, a form action's error, a form action's success, an action answer with no words]
added: 0.1.0
updated: 0.92.0
source: Capsomer mockup (design/mockup.html, the status region and its say function); the Capsid Portal's lib/messages.ts and App.tsx message region (0.1.1)
replaces:
  - 'role="status"[^>]*class="(msg|toast|flash|notice)'
  - "(toast|sonner|react-hot-toast|notistack)"
  - 'class="msg-region'
  - 'statusRef\.current\?\.focus\(\)'
---

# Message

## Usage

```html
<div class="cap-message" data-cap="message" role="status" aria-label="Results and failures" aria-atomic="false"></div>
```

```html
<div class="cap-message-item" data-cap-part="item" data-id="1" data-lasting data-kind="warning">
  <svg class="cap-message-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">[glyph]</svg>
  <p class="cap-message-text" data-cap-part="text">
    <span data-cap-part="said">Seat start is on.</span>
    <span class="cap-message-warning"> <b>Warning:</b> the audit row naming you was not written.</span>
    <span class="cap-message-error" role="alert" hidden></span>
  </p>
  <button type="button" class="cap-link-btn cap-message-undo" data-cap-part="undo"><span>Undo</span> <kbd aria-hidden="true">z</kbd></button>
  <button type="button" class="cap-btn cap-message-dismiss" data-cap-part="dismiss">Dismiss</button>
</div>
```

```ts
import { enhance, say, fail } from "capsomer/behavior/message";
enhance();
say("Moved the mention from fieldnotes.example to Trash.", {
  undo: () => restore(mention),
  undone: "The mention from fieldnotes.example is waiting again.",
  returnFocus: binButton,
});
say("Seat start is on.", { undo: () => api.undoSeat(), warning: result.warning });
say("Copied the link to the mention.", { clears: true });
fail("Refresh failed: the watcher pass failed: GitHub answered 502.");
```

## Accessibility

| Key | Does |
| --- | --- |
| `z` | Runs the newest Undo, once. Ignored in a text field, with Ctrl, Alt, Meta or Shift held, or when there is nothing to undo |
| Enter or Space on Undo | Runs Undo; focus moves to the control that was undone, else to that message's Dismiss |
| Enter or Space on Dismiss | Clears that message; focus returns to the control that caused the message |
| (a message appears) | Focus does not move |
| (a form action answers) | Focus moves to the action's result line (`useActionResult`), unless `focus` says otherwise |

- `role="status"` is polite. A new message is read by itself, with the names of its buttons, so a listener hears that Undo is there. A failure and a failed Undo's reason are `role="alert"` and are announced at once.
- The same words said twice are announced twice (every message is a new element).
- The `z` hint is `aria-hidden`, so the button's name is "Undo".
- Text 4.5:1 on its raised background; each message's edge 3:1 (`--dim`, or `--warn` when it stays); buttons at least `var(--target)`.
