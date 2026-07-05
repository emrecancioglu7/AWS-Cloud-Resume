import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "tr";

const LanguageContext = createContext<{ lang: Language; toggleLang: () => void; setLang: (lang: Language) => void } | null>(null);

const STORAGE_KEY = "lang";

function getInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "tr") return stored;
  return window.navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "en" ? "tr" : "en"));

  return <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
