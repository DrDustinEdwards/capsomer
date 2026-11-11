import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { PlainForm, type FormComponent } from "../content/content.react.tsx";

export type { FormComponent };

export interface InlineAddFormProps {
  // The fields, usually Field elements: "New chapter", "First scene".
  children: ReactNode;
  // The button's words: "Start it", "Add".
  submit: ReactNode;
  // Hidden fields the action needs: { intent: "new-chapter" }.
  hidden?: Record<string, string>;
  // Where it posts, and the router's form. A plain <form> without it.
  action?: string;
  Form?: FormComponent;
  // A post in flight: the button shows its spinner.
  pending?: boolean;
  // The form's name, when the fields' labels do not say what it adds: "Add a chapter".
  label?: string;
}

// One line that starts a new thing by name: its fields and one button, posting a form, so it
// works with no script.
export function InlineAddForm({
  children,
  submit,
  hidden,
  action,
  Form = PlainForm,
  pending = false,
  label,
}: InlineAddFormProps) {
  return (
    <Form method="post" action={action} className="cap-inline-add" aria-label={label}>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <Button type="submit" pending={pending}>
        {submit}
      </Button>
    </Form>
  );
}
