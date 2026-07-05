import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { ScrollTopButton } from "./ScrollTopButton";
import { ScrollProgressBar } from "./ScrollProgressBar";
import { useLanguage } from "../i18n/LanguageContext";
import { uiText } from "../i18n/ui";
import { focusRing } from "../styles/focusRing";

export function Layout({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <a
        href="#main-content"
        className={`fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-text) transition-transform focus:translate-y-0 ${focusRing}`}
      >
        {uiText[lang].skipToContent}
      </a>
      <ScrollProgressBar />
      <Nav />
      <main id="main-content" className="lg:pl-20">
        {children}
      </main>
      <ScrollTopButton />
    </div>
  );
}
