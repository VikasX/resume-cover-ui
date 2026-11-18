import React from "react";
const paths = {
  document: "M14 2H6v20h14V8z M14 2v6h6 M8 13h8 M8 17h6",
  upload: "M14 2H6v20h14V8z M14 2v6h6 M12 18v-7 M9 14l3-3 3 3",
  sun: "M12 3V1 M12 23v-2 M3 12H1 M23 12h-2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10",
  edit: "M16 3l5 5 M4 16L17 3l4 4L8 20H4z",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  copy: "M9 9h12v12H9z M5 16H3V3h13v2",
  download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  layers: "M12 3L2 8l10 5 10-5z M2 12l10 5 10-5 M2 16l10 5 10-5",
};
export default function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.document} />
    </svg>
  );
}
