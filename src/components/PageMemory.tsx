"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { notePage } from "@/lib/previous-page";

/** Remembers the page before this one, for the back buttons. */
export function PageMemory() {
  const pathname = usePathname();
  useEffect(() => notePage(pathname), [pathname]);
  return null;
}
