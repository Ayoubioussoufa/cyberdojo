"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * For long lists. A normal Link fetches its page as soon as it scrolls into
 * view, which is 150 requests on the roadmap. This one waits for the pointer or
 * for keyboard focus, which is still early enough to feel instant.
 */
export function HoverLink({ href, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const ready = () => router.prefetch(href);
  return <Link href={href} prefetch={false} onMouseEnter={ready} onFocus={ready} onTouchStart={ready} {...rest} />;
}
