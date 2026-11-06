import type { Metadata } from "next";
import { Account } from "@/components/Account";

export const metadata: Metadata = { title: "Your account" };

export default function Page() {
  return (
    <div className="page narrow">
      <Account />
    </div>
  );
}
