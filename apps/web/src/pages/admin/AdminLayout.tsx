import type { MouseEvent, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Moon, Receipt, Sun, Wallet } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { focusRing } from "../../styles/focusRing";
import { useTheme } from "../../theme/ThemeContext";
import { Tooltip } from "./Tooltip";

const TABS = [
  { to: "/admin", label: "Portföy", icon: Wallet },
  { to: "/admin/statements", label: "Harcamalar", icon: Receipt },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { email, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-(--color-bg) px-6 py-10 text-(--color-text)">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-bold text-(--color-accent)">
              EÇ
            </span>
            <p className="text-sm text-(--color-text-muted)">{email}</p>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}>
              <button
                onClick={(e: MouseEvent<HTMLButtonElement>) => toggleTheme({ x: e.clientX, y: e.clientY })}
                aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
                className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-(--color-text-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-text) ${focusRing}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === "dark" ? (
                    <motion.span
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sun size={16} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Moon size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Tooltip>
            <button
              onClick={signOut}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text) ${focusRing}`}
            >
              <LogOut size={15} /> Çıkış yap
            </button>
          </div>
        </div>

        <nav className="relative mb-8 flex gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.to;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
                  isActive ? "text-(--color-accent)" : "text-(--color-text-muted) hover:text-(--color-text)"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-tab-pill"
                    className="absolute inset-0 rounded-lg bg-(--color-accent-soft)"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={15} /> {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
