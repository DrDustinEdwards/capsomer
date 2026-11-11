import {
  useState,
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { Banner } from "../banner/banner.react.tsx";

// The app's form component, such as React Router's Form: any component whose action, method and
// encType take these values fits.
export type FormComponent = ComponentType<
  Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "encType"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  }
>;

// A form that a read-only visitor (a demo, a viewer without the right) can press but not send:
// the submit stays in the browser and the reason shows under the form, in place, where an
// error page would have thrown them out. Not the security boundary: the server refuses the
// write too, for a post without script or by hand.
export function ReadOnlyForm({
  readOnly,
  message,
  form = "form",
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
  form?: FormComponent | "form";
  ref?: Ref<HTMLFormElement>;
}) {
  const [refused, setRefused] = useState(false);
  const Form = form as FormComponent;
  return (
    <Form
      {...rest}
      {...({ ref } as object)}
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
