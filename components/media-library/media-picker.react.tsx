// "Insert from library" and the image field built on it. The dialog holds MediaLibrary in picker
// mode over a media endpoint: its links and its search load the next view into the dialog instead
// of leaving the page. The picker's alt step starts from the file's own alt text, and the pick
// carries the file's own caption. ImageField is a page's one chosen image (a share image, a
// feature image): its preview, Choose or Choose another, Remove, and the alt text the host renders
// under it.
import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "../button/button.react.tsx";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
import type { MediaData } from "../content/content.ts";
import { libraryOf, loadMediaView } from "./media-picker.ts";

// The library is its own chunk, fetched when the dialog opens, so a page that only draws the button
// (an editor, a settings form) does not carry it.
const MediaLibrary = lazy(() =>
  import("./media-library.react.tsx").then((m) => ({ default: m.MediaLibrary })),
);

const LOADING = (
  <p className="cap-muted" role="status">
    Loading media...
  </p>
);

export interface MediaPick {
  url: string;
  alt: string;
  caption: string;
}

export interface PickerWords {
  // The button that opens it.
  label: string;
  title: string;
  lead: string;
}

export const INSERT_WORDS: PickerWords = {
  label: "Insert from library",
  title: "Insert an image from the library",
  lead: "Pick an image already on the site, then describe it. It is not in the page until it has alt text.",
};

export interface MediaPickerProps {
  // The library as JSON: GET with the library page's own query answers MediaData.
  endpoint: string;
  // The library page's address its links point to (default: the endpoint without "/api").
  library?: string;
  onPick: (pick: MediaPick) => void;
  words?: PickerWords;
  variant?: "quiet" | "default";
}

export function MediaPicker({
  endpoint,
  library = libraryOf(endpoint),
  onPick,
  words = INSERT_WORDS,
  variant = "quiet",
}: MediaPickerProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<MediaData | null>(null);
  const [error, setError] = useState("");

  const load = async (query: string) => {
    setError("");
    try {
      setData(await loadMediaView(endpoint, query));
    } catch (thrown) {
      setError((thrown as Error).message);
    }
  };
  // The memoized form calls the latest load; the ref is set after each render, not during it.
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });
  const loadFirst = useEffectEvent(() => void loadRef.current(""));
  useEffect(() => {
    if (open && !data && !error) loadFirst();
  }, [open, data, error]);

  // A link to another view of the library (a tag, a page, a file to choose) loads it here.
  const follow = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as Element).closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== library) return;
    event.preventDefault();
    void load(url.search);
  };
  // The search form is a GET of the library's own address: run it here too. One component for the
  // dialog's life, so a render never remounts the form being typed in.
  const PickerForm = useMemo<FormComponent>(
    () =>
      function PickerForm({ onSubmit, ...props }) {
        return (
          <form
            {...props}
            onSubmit={(event) => {
              onSubmit?.(event);
              if (event.defaultPrevented || (props.method ?? "get").toLowerCase() !== "get") return;
              event.preventDefault();
              const query = new URLSearchParams();
              for (const [k, v] of new FormData(event.currentTarget))
                if (typeof v === "string" && v) query.append(k, v);
              void loadRef.current(`?${query}`);
            }}
          />
        );
      },
    [],
  );

  const close = () => {
    setOpen(false);
    setData(null);
    setError("");
  };

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={(event) => {
          setOpener(event.currentTarget);
          setOpen(true);
        }}
      >
        {words.label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && close()}
        placement="center"
        size="lg"
        returnTo={opener}
        aria-labelledby={titleId}
      >
        <DialogHeader divider>
          <DialogTitle id={titleId}>{words.title}</DialogTitle>
          <DialogDescription>{words.lead}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div onClickCapture={follow}>
            {error ? (
              <Empty kind="failed" flush title="The library did not answer">
                {error}
              </Empty>
            ) : data ? (
              <Suspense fallback={LOADING}>
                <MediaLibrary
                  data={data}
                  action={library}
                  Form={PickerForm}
                  mode="picker"
                  onPick={({ id, url, alt }) => {
                    const caption = data.rows.find((r) => r.key === id)?.caption ?? "";
                    onPick({ url, alt, caption });
                    close();
                  }}
                />
              </Suspense>
            ) : (
              LOADING
            )}
          </div>
        </DialogBody>
        <DialogFooter align="between">
          <DialogClose part="cancel">Cancel</DialogClose>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export interface ImageFieldProps {
  label: string;
  // The stored address (/media/<key>), or "" for none.
  value: string;
  // Where this page loads the preview from (default: value).
  src?: string;
  alt?: string;
  // Said in the preview's place when there is no image ("No share image: the site's default is used").
  none?: string;
  // The picker; without it the host renders its own address input as children.
  picker?: Omit<MediaPickerProps, "onPick" | "words" | "variant"> & { words?: PickerWords };
  onPick?: (pick: MediaPick) => void;
  onRemove?: () => void;
  // Read-only: no Choose, no Remove.
  locked?: boolean;
  // The preview's shape (default 1200 / 630, a share card).
  ratio?: string;
  // Under the controls: the alt text field, "Only decoration".
  children?: ReactNode;
}

export function ImageField({
  label,
  value,
  src = value,
  alt = "",
  none = "No image",
  picker,
  onPick,
  onRemove,
  locked = false,
  ratio,
  children,
}: ImageFieldProps) {
  const labelId = useId();
  const words = picker?.words ?? { ...INSERT_WORDS, label: "Choose from library" };
  return (
    <div className="cap-image-field" role="group" aria-labelledby={labelId}>
      <span className="cap-field-label" id={labelId}>
        {label}
      </span>
      <div className="cap-image-field-row">
        <div className="cap-image-field-thumb" style={ratio ? { aspectRatio: ratio } : undefined}>
          {value ? <img src={src} alt={alt} /> : <span className="cap-muted">{none}</span>}
        </div>
        <div className="cap-image-field-controls">
          {value && picker ? <p className="cap-image-field-url cap-mono">{value}</p> : null}
          {!locked && (picker || (value && onRemove)) ? (
            <div className="cap-image-field-actions">
              {picker && onPick ? (
                <MediaPicker
                  {...picker}
                  words={{ ...words, label: value ? "Choose another" : words.label }}
                  variant="default"
                  onPick={onPick}
                />
              ) : null}
              {value && onRemove ? (
                <Button variant="quiet" size="sm" onClick={onRemove}>
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
