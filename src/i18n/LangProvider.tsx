"use client";

import { createContext, useContext } from "react";
import { fill, type Lang } from "./lang";
import type { Dict } from "./ui";

interface LangValue {
  lang: Lang;
  t: Dict;
}

const LangContext = createContext<LangValue | null>(null);

/** The root layout passes only the current language's strings, so the other one never reaches the browser. */
export function LangProvider({ lang, t, children }: LangValue & { children: React.ReactNode }) {
  return <LangContext.Provider value={{ lang, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const v = useContext(LangContext);
  if (!v) throw new Error("useLang needs <LangProvider> above it");
  return v;
}

/** "{n} day|{n} days": English uses the first form for 1, French for 0 and 1. */
export function plural(lang: Lang, msg: string, n: number, vars: Record<string, string | number> = {}) {
  const [one, many = one] = msg.split("|") as [string, string?];
  const single = lang === "fr" ? Math.abs(n) < 2 : n === 1;
  return fill(single ? one : many, { n, ...vars });
}

export { fill };
