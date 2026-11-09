"use client";

import { useLang } from "@/i18n/LangProvider";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Waiting = ({ label }: { label: string }) => <section className="range range-wait" aria-busy="true" aria-label={label} />;

const Loading = ({ what }: { what: "drill" | "range" }) => {
  const { t } = useLang();
  return <Waiting label={what === "drill" ? t.misc.loadingDrill : t.misc.loadingRange} />;
};

const Drill = dynamic(() => import("./Drill").then((m) => m.Drill), { ssr: false, loading: () => <Loading what="drill" /> });
const Range = dynamic(() => import("./Range").then((m) => m.Range), { ssr: false, loading: () => <Loading what="range" /> });

/** Keeps heavy parts out of the first load: their code arrives as the reader gets near. */
function WhenNear({ label, children }: { label: string; children: React.ReactNode }) {
  const spot = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = spot.current;
    if (!el || near) return;
    const watch = new IntersectionObserver((seen) => {
      if (seen.some((e) => e.isIntersecting)) setNear(true);
    }, { rootMargin: "900px 0px" });
    watch.observe(el);
    return () => watch.disconnect();
  }, [near]);
  return <div ref={spot}>{near ? children : <Waiting label={label} />}</div>;
}

export const LazyDrill = ({ id, roundSize, bare }: { id: string; roundSize?: number; bare?: boolean }) => (
  <WhenNear label={useLang().t.misc.exercises}><Drill id={id} bare={bare} {...(roundSize ? { roundSize } : {})} /></WhenNear>
);

export const LazyRange = ({ id, bare }: { id: string; bare?: boolean }) => (
  <WhenNear label={useLang().t.misc.terminal}><Range id={id} bare={bare} /></WhenNear>
);
