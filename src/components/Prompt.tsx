"use client";

import Link from "@/components/HoverLink";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/account";

/**
 * The site's breadcrumb, written as a shell prompt: `guest@cyberdojo:~/courses/0047-…$`.
 * Each directory is a link back up the tree. The cursor is the only idle animation
 * on the site, and it stops when the visitor asks for reduced motion.
 */
export function Prompt() {
  const path = usePathname() ?? "/";
  const { ready, user } = useAccount();
  const parts = path.split("/").filter(Boolean);
  const name = ready && user ? user.username : "guest";
  return (
    <div className="prompt">
      <p className="prompt-in" aria-label={`You are here: ${["home", ...parts].join(", ")}`}>
        <span className="prompt-user">{name}@cyberdojo</span>
        <span>:</span>
        <span className="prompt-path">
          <Link href="/">~</Link>
          {parts.map((p, i) => (
            <span key={i}>
              /<Link href={`/${parts.slice(0, i + 1).join("/")}/`}>{p}</Link>
            </span>
          ))}
        </span>
        <span>$</span>
        <span className="prompt-cursor" aria-hidden="true" />
      </p>
    </div>
  );
}
