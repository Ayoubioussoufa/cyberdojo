"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Waiting = ({ label }: { label: string }) => <section className="range range-wait" aria-busy="true" aria-label={label} />;

const Drill = dynamic(() => import("./Drill").then((m) => m.Drill), { ssr: false, loading: () => <Waiting label="Loading the exercises" /> });
const Range = dynamic(() => import("./Range").then((m) => m.Range), { ssr: false, loading: () => <Waiting label="Loading the terminal" /> });

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

export const LazyDrill = ({ id, roundSize }: { id: string; roundSize?: number }) => (
  <WhenNear label="Exercises"><Drill id={id} {...(roundSize ? { roundSize } : {})} /></WhenNear>
);

export const LazyRange = ({ id }: { id: string }) => (
  <WhenNear label="Terminal"><Range id={id} /></WhenNear>
);
