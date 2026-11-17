import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource-variable/martian-mono/wdth.css";
// The other fonts on offer in the appearance settings. Only declared here: a browser downloads one only when it's chosen.
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/lexend/wght.css";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "@fontsource-variable/source-serif-4/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/fira-code/wght.css";
import "../globals.css";
import { AccountStart } from "@/components/AccountStart";
import { AppearanceSync } from "@/components/Appearance";
import { APPEARANCE_SCRIPT } from "@/lib/appearance";
import { Nav } from "@/components/Nav";
import { Prompt } from "@/components/Prompt";
import { Track } from "@/components/Track";
import { TutorDock } from "@/components/tutor/TutorDock";
import { LangProvider } from "@/i18n/LangProvider";
import { LANGS, isLang } from "@/i18n/lang";
import { UI } from "@/i18n/ui";
import { DESKTOP } from "@/lib/desktop";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = UI[isLang(lang) ? lang : "en"];
  return {
    title: { default: "CyberDojo", template: "%s | CyberDojo" },
    description: t.common.siteDescription,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c1218" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1218" },
  ],
};

const THEME = `try{var t=localStorage.getItem("theme");if(t!=="light")t="dark";document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = UI[lang];
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME + APPEARANCE_SCRIPT }} />
      </head>
      <body>
        <LangProvider lang={lang} t={t}>
          <a className="skip" href="#main">{t.common.skip}</a>
          <AccountStart />
          <AppearanceSync />
          {!DESKTOP && <Track />}
          <Nav />
          <Prompt />
          <main id="main">{children}</main>
          {DESKTOP && <TutorDock />}
        </LangProvider>
      </body>
    </html>
  );
}
