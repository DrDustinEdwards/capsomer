import type { ComponentType, FormHTMLAttributes } from "react";

// The host router's form (React Router's <Form> or fetcher.Form), so a post stays in the app. Its own
// module, so a component that takes a form loads nothing else. action is an address and encType one of
// the three encodings, as React Router types them (React's own form also takes a function), so its Form fits.
export type FormComponent = ComponentType<
  Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "encType" | "method"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  }
>;

export const PlainForm: FormComponent = (props) => <form {...props} />;
