import type { Metadata, Viewport } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";
import { AccountStart } from "@/components/AccountStart";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "CyberDojo", template: "%s · CyberDojo" },
  description: "Cybersecurity from absolute zero to job-ready: a 24-month course with a step-by-step roadmap, lessons, projects and a browser terminal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceff5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1430" },
  ],
};

const THEME = `try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <AccountStart />
        <Nav />
        <main id="main">{children}</main>
        <footer className="foot">
          <span>CyberDojo</span>. Only test what you own or have written permission to test.
        </footer>
      </body>
    </html>
  );
}
