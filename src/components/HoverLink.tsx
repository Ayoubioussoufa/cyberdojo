"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useLang } from "@/i18n/LangProvider";
import { localize } from "@/i18n/lang";

/**
 * The site's link. Next's own Link fetches every page it can see, which was 40
 * to 70 requests on each load. This one waits for the pointer or keyboard focus,
 * which is still early enough for a click to feel instant. Hrefs are written for
 * the English site; on the French one they gain the /fr prefix here.
 */
export function HoverLink({ href, ...rest }: ComponentProps<typeof NextLink> & { href: string }) {
  const router = useRouter();
  const { lang } = useLang();
  const to = localize(href, lang);
  const ready = () => router.prefetch(to);
  return <NextLink href={to} prefetch={false} onMouseEnter={ready} onFocus={ready} onTouchStart={ready} {...rest} />;
}

export default HoverLink;
