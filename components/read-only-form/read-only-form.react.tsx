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

// A form that a read-only visitor (a demo, a viewer without the right) can press but not send:
// the submit stays in the browser and the reason shows under the form, in place, where an
// error page would have thrown them out. Not the security boundary: the server refuses the
// write too, for a post without script or by hand.
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
  // Why nothing was sent ("This is a demo: changes are not saved.").
  message: ReactNode;
  // The app's form (React Router's Form); a plain form by default. It is given the ref.
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
