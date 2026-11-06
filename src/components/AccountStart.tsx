"use client";

import { useEffect } from "react";
import { startAccount } from "@/lib/account";

/** Pages are pre-rendered, so the account is looked up in the browser after load. */
export function AccountStart() {
  useEffect(() => {
    void startAccount();
  }, []);
  return null;
}
