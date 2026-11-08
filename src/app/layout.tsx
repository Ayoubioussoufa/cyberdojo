import type { Metadata, Viewport } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "./globals.css";
import { AccountStart } from "@/components/AccountStart";
import { Nav } from "@/components/Nav";
import { Prompt } from "@/components/Prompt";

export const metadata: Metadata = {
  title: { default: "CyberDojo", template: "%s | CyberDojo" },
  description: "Cybersecurity from absolute zero to job-ready: a 24-month course with a step-by-step roadmap, lessons, projects and a browser terminal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c1218" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1218" },
  ],
};

const THEME = `try{var t=localStorage.getItem("theme");if(t!=="light")t="dark";document.documentElement.dataset.theme=t}catch(e){}`;

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
        <Prompt />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
