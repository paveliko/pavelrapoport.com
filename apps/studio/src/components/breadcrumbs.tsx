"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";

function titleCase(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const labels = segments.length === 0 ? ["Dashboard"] : segments.map(titleCase);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      {labels.map((label, index) => (
        <Fragment key={`${label}-${index}`}>
          {index > 0 && <span className="mx-2 text-muted-foreground/60">·</span>}
          <span className={index === labels.length - 1 ? "text-foreground" : undefined}>
            {label}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}
