# Dialog (new shared component)

- No breaking change for an app on 0.1. `components/confirm-dialog/confirm-dialog.ts` re-exports `rememberOpener`, `returnFocus`, `isBackdropClick`, `errorText`, `uid` and `isBusy` from `components/dialog/dialog.ts`, so every existing import keeps working.
- New: `capsomer/dialog.css`, `capsomer/behaviour/dialog` and `capsomer/react/dialog`. An app that loads every component's CSS gets `.cap-dialog` from both the confirm dialog and the dialog until the confirm dialog moves onto it; load the dialog's CSS before the confirm dialog's if the 0.1 look must stay.
- New: a locked page scroll while any `.cap-dialog` is modal (`:root:has(.cap-dialog:modal)`); an app that already locks scroll itself is unaffected.
