import { notFound } from "next/navigation";

/** Every address that matches no page lands here, inside the right language's layout. */
export const generateStaticParams = () => [];

export default function Page() {
  notFound();
}
