import type { ComponentType, FormHTMLAttributes } from "react";

// The host router's form (React Router's <Form> or fetcher.Form), so a post or a filter stays in
// the app, given the props a plain <form> takes. Its own module, so a component that takes a form
// loads nothing else: `import { PlainForm, type FormComponent } from "capsomer/react/plain-form"`.
// action is an address and encType one of the three encodings a form can send, as React Router
// types them (React's own form also takes a function and any string), so its Form fits.
export type FormComponent = ComponentType<
  Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "encType" | "method"> & {
    action?: string;
    method?: "get" | "post";
    encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  }
>;

// A plain <form>, for a page with no router form.
export const PlainForm: FormComponent = (props) => <form {...props} />;
