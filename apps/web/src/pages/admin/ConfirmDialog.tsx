import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { focusRing } from "../../styles/focusRing";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<{ confirm: (options: ConfirmOptions) => Promise<boolean> } | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
            onClick={() => settle(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-xl"
            >
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="shrink-0 text-red-400" />
                <h2 className="font-heading text-base font-semibold text-(--color-text)">{pending.options.title}</h2>
              </div>
              {pending.options.description && <p className="mb-5 text-sm text-(--color-text-muted)">{pending.options.description}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => settle(false)} className={`rounded-lg px-3.5 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text) ${focusRing}`}>
                  Vazgeç
                </button>
                <button onClick={() => settle(true)} className={`rounded-lg bg-red-500 px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${focusRing}`}>
                  {pending.options.confirmLabel ?? "Sil"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
