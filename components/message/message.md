---
name: message
title: Message
summary: The page's one status region; the result of an action, with Undo, that never takes focus.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [empty, plain message, message with Undo, after Undo, clears itself]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, the status region and its say function)
replaces:
  - 'role="status"[^>]*class="(msg|toast|flash|notice)'
  - "(toast|sonner|react-hot-toast|notistack)"
---

# Message

The result of an action, said in the page: "Moved the mention to the bin", with Undo. One region per page, `role="status"`, so a screen reader hears it without focus moving.

## When to use it

- After a reversible action that happened at once: say what happened and offer Undo (patterns.md "Reversible").
- After an action whose result is not otherwise visible: "Published to TXASM newsletter."

## When not to

- An error is not a message. Put it beside its source as an alert (`.cap-alert`), or, for a failed page read, a banner that keeps the last good data (`.cap-banner`). See Banner.
- A one-way action is previewed in a confirm dialog before it happens, not undone after.
- Never a floating toast (decision, 0.1).

## The default and its reason

- **One region per page, `role="status"`, present from the start.** A live region added at the moment it speaks is often not announced. Empty, it shows nothing and takes no space.
- **It never takes focus.** The person keeps their place; the region speaks politely.
- **A message with Undo stays until dismissed** (decision, 0.1). Every message that stays has Dismiss.
- **`z` runs the current Undo** when focus is not in a text field and no modifier is held. The key is shown beside the Undo button. `data-cap-undo-key="off"` on the region (React: `undoKey={false}`) switches it off with the app's other single-key shortcuts.
- **Undo runs once,** then the region says what was undone: "Undone. The mention from fieldnotes.example is waiting again." Pass `undone` to say it in your own words; otherwise it reads "Undone: " and the message. If Undo fails, nothing was undone, so Undo stays and the region says "Could not undo that. Try again."
- **A plain confirmation may clear itself after 4 seconds** (`clears: true`) only when the control that caused it shows it too ("Copy link" turns to "Copied"). Such a message has no buttons. A message with Undo never clears itself.
- **Focus is never left on nothing.** If Undo had focus, focus moves to Dismiss; if Dismiss had focus, it returns to the control that caused the message, else the main region.
- **It sits at the bottom of the view's scroll area** (`position: sticky`), in the page's flow, so a result shows near the action even in a long view.

## Keyboard

| Key | Does |
| --- | --- |
| `z` | Runs the current Undo, once. Ignored in a text field, with Ctrl, Alt, Meta or Shift held, or when there is nothing to undo |
| Enter or Space on Undo | Runs Undo; focus moves to Dismiss |
| Enter or Space on Dismiss | Clears the message; focus returns to the control that caused it |
| (a message appears) | Focus does not move |

## Accessibility

- `role="status"` is polite and atomic: the message is read whole, with the names of its buttons, so a listener hears that Undo is there.
- The same words said twice are announced twice (the text is cleared and set again).
- The `z` hint is `aria-hidden`, so the button's name is "Undo".
- Text 4.5:1 on its raised background; the region's edge 3:1; buttons at least `var(--target)`.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-message" data-cap="message" role="status">
  <p class="cap-message-text" data-cap-part="text"></p>
  <button type="button" class="cap-link-btn cap-message-undo" data-cap-part="undo" hidden>Undo <kbd aria-hidden="true">z</kbd></button>
  <button type="button" class="cap-btn cap-message-dismiss" data-cap-part="dismiss" hidden>Dismiss</button>
</div>
```

```ts
import { enhance, say } from "capsomer/behaviour/message";
enhance();
say("Moved the mention from fieldnotes.example to the bin.", {
  undo: () => restore(mention),
  undone: "The mention from fieldnotes.example is waiting again.",
});
say("Copied the link to the mention.", { clears: true });
```

`enhance()` adds any missing part. In React, wrap the app in `<MessageProvider>` and call `const { say } = useMessage()`; the provider renders the region after its children, or pass `region={false}` and place `<MessageRegion />` yourself.

## Exceptions in production

None yet.
