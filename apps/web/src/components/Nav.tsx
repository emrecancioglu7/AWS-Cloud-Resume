import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Home, Languages, Layers, Menu, Moon, Sun, User, X } from "lucide-react";
import { uiText } from "../i18n/ui";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { useScrollSpy } from "../hooks/useScrollSpy";

const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  user: User,
  file: FileText,
  stack: Layers,
};

const sectionIds = uiText.en.nav.links.map((l) => l.href.slice(1));

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)";

// Sidebar expansion is driven by tracking the raw cursor position against the sidebar's rect
// on every mousemove, rather than CSS :hover or mouseenter/mouseleave — Chromium's view
// transition (used for the theme-change circular reveal) briefly freezes the page and fires
// spurious mouseleave/mouseenter events on the real DOM while it plays, which made the sidebar
// flicker to its mini width and back even though the cursor never actually moved. Since a real
// mousemove only fires when the cursor genuinely moves, this sidesteps that entirely.
function getLabelClass(expanded: boolean) {
  return `relative z-10 whitespace-nowrap opacity-100 transition-opacity duration-150 lg:group-focus-within:opacity-100 ${
    expanded ? "lg:opacity-100 lg:duration-300" : "lg:opacity-0"
  }`;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const ui = uiText[lang];
  const isHome = pathname === "/";
  const activeId = useScrollSpy(sectionIds);
  const labelClass = getLabelClass(expanded);

  useEffect(() => {
    if (!isHome) return;
    window.history.replaceState(null, "", `#${activeId}`);
  }, [activeId, isHome]);

  useEffect(() => {
    function handleMouseMove(e: globalThis.MouseEvent) {
      const rect = asideRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      setExpanded(inside);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const links = ui.nav.links.map((link) => {
    const Icon = icons[link.icon];
    const isActive = isHome && activeId === link.href.slice(1);
    const content = (
      <>
        {isActive && (
          <motion.div
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-lg bg-(--color-accent-soft)"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <Icon size={20} className={`relative z-10 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
        <span className={labelClass}>{link.label}</span>
      </>
    );
    const className = `relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors active:scale-95 ${
      isActive ? "text-(--color-accent)" : "text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text)"
    } ${focusRing}`;

    return isHome ? (
      <a key={link.href} href={link.href} className={className} onClick={() => setOpen(false)}>
        {content}
      </a>
    ) : (
      <Link key={link.href} to={`/${link.href}`} className={className} onClick={() => setOpen(false)}>
        {content}
      </Link>
    );
  });

  return (
    <>
      <button
        aria-label={ui.nav.toggleMenu}
        onClick={() => setOpen((v) => !v)}
        className={`fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-transform active:scale-90 lg:hidden ${focusRing}`}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        ref={asideRef}
        className={`group fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between overflow-hidden border-r border-(--color-border) bg-(--color-surface) p-4 transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 lg:py-6 lg:focus-within:w-64 ${
          expanded ? "lg:w-64" : "lg:w-20"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <Link to="/" className={`mb-8 flex items-center gap-3 rounded-lg px-0.5 ${focusRing}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-bold text-(--color-accent)">
              EÇ
            </span>
            <span className={`font-heading text-lg font-semibold text-(--color-text) ${labelClass}`}>Emre Çancıoğlu</span>
          </Link>
          <nav className="flex flex-col gap-1">{links}</nav>
        </div>

        <div className="flex flex-col gap-1">
          <button
            aria-label={ui.nav.switchLanguage}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              toggleLang();
              if (e.detail !== 0) e.currentTarget.blur();
            }}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-(--color-text-muted) transition-colors active:scale-95 hover:bg-(--color-surface-2) hover:text-(--color-text) ${focusRing}`}
          >
            <Languages size={20} className="shrink-0" />
            <span className={labelClass}>{lang === "en" ? "Türkçe" : "English"}</span>
          </button>

          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              toggleTheme({ x: e.clientX, y: e.clientY });
              if (e.detail !== 0) e.currentTarget.blur();
            }}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-(--color-text-muted) transition-colors active:scale-95 hover:bg-(--color-surface-2) hover:text-(--color-text) ${focusRing}`}
          >
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sun size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Moon size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className={labelClass}>{theme === "dark" ? ui.nav.lightMode : ui.nav.darkMode}</span>
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
