import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type Language = "en" | "tr";

const LanguageContext = createContext<{ lang: Language; toggleLang: () => void; setLang: (lang: Language) => void } | null>(null);

// Only written on an explicit language switch — index.html's inline script reads it to send a
// returning visitor who picked Turkish from "/" to "/tr" before first paint.
const STORAGE_KEY = "lang";

export function langPath(lang: Language) {
  return lang === "tr" ? "/tr" : "/";
}

// The public pages carry their language in the URL ("/" = English, "/tr" = Turkish) so each
// language is a separately crawlable, prerendered page. Other routes (/admin) have no language
// in the URL and fall back to the last explicit choice.
function langFromPath(pathname: string): Language | null {
  if (pathname === "/tr" || pathname.startsWith("/tr/")) return "tr";
  if (pathname === "/") return "en";
  return null;
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "tr" ? stored : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [fallbackLang, setFallbackLang] = useState<Language>(() => readStoredLanguage() ?? "en");
  const urlLang = langFromPath(pathname);
  const lang = urlLang ?? fallbackLang;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode) — the URL still carries the language.
    }
    setFallbackLang(next);
    // window.location.hash rather than useLocation's: Nav's scroll-spy updates the hash via
    // history.replaceState, which the router doesn't observe.
    if (urlLang !== null && next !== urlLang) navigate({ pathname: langPath(next), hash: window.location.hash });
  };

  const toggleLang = () => setLang(lang === "en" ? "tr" : "en");

  return <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
