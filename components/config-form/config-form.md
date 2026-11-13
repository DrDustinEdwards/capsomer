---
name: config-form
title: Config form
summary: An operator's add and edit form for a list of settings, with the editor state that opens and closes it.
parts: [css, react]
tool: native
states: [a list with Add and Edit, the form open on a new row, the form editing a row with its Danger area, the hint while the draft cannot be sent]
added: 0.100.0
updated: 0.106.0
source: the Capsid Portal's ConfigForm (dashboard/src/views/ConfigForm.tsx) and its editors in Sites.tsx, Packages.tsx and Projects.tsx
---

# Config form

The one shell for adding and editing rows of settings (sites, packages, projects): a panel that opens above the list, puts focus in its first field, shows a hint while the draft cannot be sent, and submits to a preview that shows what will change before anything does. `useEditor` is the list's side: which form is open and the key that gives each row a fresh draft.

## When to use it

An operator's list of configured things, each added and edited in place, where a change is confirmed before it is made.

## When not to

A one-off setting is a field with its own save. A long multi-step setup is the setup checklist or a stepped form. A change that takes effect at once (a switch) does not need a preview.

## The default and its reason

- **Focus goes to the first field** and the panel scrolls into view when it opens, so a keyboard user lands where the work is. When it closes (Cancel, Esc, a save), focus goes back to the control that opened it, if focus went with the form.
- **Preview, not Save.** The submit opens the app's confirm dialog with what the server will do and changes nothing itself (`submitLabel` if an app's flow differs).
- **A hint, not a disabled button.** While the draft cannot be sent, the submit stays enabled and pressing it shows why in a hint that is announced (`role="alert"`); a disabled button would not say why.
- **Esc cancels**, as Cancel does.
- **Danger is apart**: Remove sits under the actions, across a rule, never beside Preview.
- **One editor per list.** `useEditor()` holds add or edit-this-row; opening one closes the other, and `formKey` ("add", "edit:<key>") is the form's React key, so switching rows starts a fresh draft.
- Fields sit in two columns where there is room and one on a phone; the hint, actions and Danger area run across.

## Accessibility

The panel is a named region (its heading). Fields are Capsomer `Field`s, labeled and described. The hint is a warning `Alert`, announced when it appears.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in.

## Markup

Needs `panel.css`, `field.css`, `button.css` and `banner.css` (the hint is a warning `Alert`).

```tsx
import { ConfigForm, useConfigForm, useEditor } from "capsomer/react/config-form";

const ed = useEditor<SiteRow>(() => read());
<button className="cap-btn" data-variant="primary" onClick={ed.add} disabled={ed.editing?.kind === "add"}>Add site</button>
{ed.editing && <SiteForm key={ed.formKey} editing={ed.editing} onClose={ed.close} />}
// a row: onEdit={() => ed.edit(row, row.namespace)}

function SiteForm({ editing, onClose }) {
  const { f, first } = useConfigForm();
  return (
    <ConfigForm f={f} first={first} title="Add a site" hint={hint} onSubmit={preview} onClose={onClose} danger={...}>
      <Field label="Name"><input className="cap-input" id={f("name")} ref={first} ... /></Field>
    </ConfigForm>
  );
}
```

**Provenance.** EXTRACTED from the Portal's `ConfigForm` and `useConfigForm` (ConfigForm.tsx) and the `editing` state repeated in Sites, Packages and Projects, which is `useEditor` here. Kept: focus and scroll on open, the hint, Preview and Cancel, the Danger slot. Added: Esc to cancel, `submitLabel`, the Capsomer panel and field.

## Exceptions in production

None yet.
