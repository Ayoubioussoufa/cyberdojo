"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pageOpened } from "@/lib/track";

/** Counts page views and time on the site. The admin's own statistics page isn't counted. */
export function Track() {
  const pathname = usePathname();
  useEffect(() => {
    if (!/^\/(fr\/)?admin(\/|$)/.test(pathname)) pageOpened(pathname);
  }, [pathname]);
  return null;
}
