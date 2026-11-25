import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";

export type { FormComponent };

export interface InlineAddFormProps {
  children: ReactNode;
  submit: ReactNode;
  hidden?: Record<string, string>;
  action?: string;
  Form?: FormComponent;
  pending?: boolean;
  label?: string;
}

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
