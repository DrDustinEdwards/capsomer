import {
  useState,
  type ComponentProps,
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { Banner } from "../banner/banner.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";

// A form a read-only visitor (a demo, a viewer) can press but not send: the reason shows in place under
// the form. Not the security boundary: the server refuses the write too.
export function ReadOnlyForm({
  readOnly,
  message,
  form: Form = PlainForm,
  onSubmit,
  className,
  children,
  ref,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, "style" | "action" | "method" | "encType"> & {
  action?: string;
  method?: "get" | "post";
  encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  readOnly: boolean;
  message: ReactNode;
  form?: ComponentType<ComponentProps<FormComponent> & { ref?: Ref<HTMLFormElement> }>;
  ref?: Ref<HTMLFormElement>;
}) {
  const [refused, setRefused] = useState(false);
  return (
    <Form
      {...rest}
      ref={ref}
      className={className ? `cap-read-only-form ${className}` : "cap-read-only-form"}
      onSubmit={(event) => {
        if (readOnly) {
          event.preventDefault();
          setRefused(true);
          return;
        }
        onSubmit?.(event);
      }}
    >
      {children}
      {refused ? <Banner tone="neutral">{message}</Banner> : null}
    </Form>
  );
}
