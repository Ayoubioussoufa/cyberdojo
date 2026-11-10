import type { Metadata } from "next";
import { Admin } from "@/components/Admin";

export const metadata: Metadata = { title: "Usage", robots: { index: false, follow: false } };

/** The shell is public and empty. The figures come from /api/admin/stats, which answers admins only. */
export default function Page() {
  return (
    <div className="page">
      <Admin />
    </div>
  );
}
