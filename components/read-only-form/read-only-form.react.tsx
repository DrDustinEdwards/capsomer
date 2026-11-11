import {
  useState,
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { Banner } from "../banner/banner.react.tsx";

export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement>>;

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
}: Omit<FormHTMLAttributes<HTMLFormElement>, "style"> & {
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
