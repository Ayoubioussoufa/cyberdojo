"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * The site's link. Next's own Link fetches every page it can see, which was 40
 * to 70 requests on each load. This one waits for the pointer or keyboard focus,
 * which is still early enough for a click to feel instant.
 */
export function HoverLink({ href, ...rest }: ComponentProps<typeof NextLink> & { href: string }) {
  const router = useRouter();
  const ready = () => router.prefetch(href);
  return <NextLink href={href} prefetch={false} onMouseEnter={ready} onFocus={ready} onTouchStart={ready} {...rest} />;
}

export default HoverLink;
