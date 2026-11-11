// The sortable list's grip and step arrows, shared by the list and the groups.

export const Grip = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="6" cy="3.5" r="1.25" />
    <circle cx="10" cy="3.5" r="1.25" />
    <circle cx="6" cy="8" r="1.25" />
    <circle cx="10" cy="8" r="1.25" />
    <circle cx="6" cy="12.5" r="1.25" />
    <circle cx="10" cy="12.5" r="1.25" />
  </svg>
);
export const Arrow = ({ up }: { up: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5"} />
  </svg>
);
