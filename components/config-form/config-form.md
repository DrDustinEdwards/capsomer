---
name: config-form
title: Config form
summary: An operator's add and edit form for a list of settings, with the editor state that opens it.
group: pattern
parts: [css, react]
tool: native
states: [a list with Add and Edit, the form open on a new row, the form editing a row with its Danger area, the hint while the draft cannot be sent]
added: 0.100.0
updated: 0.106.0
source: the Capsid Portal's ConfigForm (dashboard/src/views/ConfigForm.tsx) and its editors in Sites.tsx, Packages.tsx and Projects.tsx
---

# Config form

## Usage

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

## Accessibility

The panel is a named region (its heading). Fields are Capsomer `Field`s, labeled and described. The hint is announced when it appears.
