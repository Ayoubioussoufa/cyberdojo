import type { Metadata } from "next";
import Link from "@/components/HoverLink";
import { Flashcards } from "@/components/Flashcards";
import { Subnav } from "@/components/Subnav";

export const metadata: Metadata = { title: "Flashcards" };

export default function Page() {
  return (
    <div className="page narrow">
      <Subnav group="practice" />
      <header className="page-head">
        <h1>Flashcards</h1>
        <p className="lede">The glossary of everything you&apos;ve studied, as spaced recall cards. Ten minutes a day keeps the vocabulary of the field at your fingertips.</p>
        <p className="meta">Why this works, and how to write your own cards: <Link href="/guides/s2-memorising-what-must-be-instant/">Memorising what must be instant</Link>.</p>
      </header>
      <Flashcards />
    </div>
  );
}
