import type { InputHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { focusRing } from "../../styles/focusRing";

export const inputClass = `w-full rounded-lg border border-(--color-border) bg-(--color-bg) py-2.5 pl-10 pr-3.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) ${focusRing}`;

export const plainInputClass = `rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) ${focusRing}`;

export const buttonClass =
  "flex items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-3.5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50";

export const iconButtonClass = `flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-muted) transition-colors hover:bg-(--color-bg) hover:text-(--color-text) ${focusRing}`;

export function IconField({ icon, className, ...props }: { icon: ReactNode; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--color-text-muted)">{icon}</span>
      <input {...props} className={className ?? inputClass} />
    </div>
  );
}

export function SubmitButton({ busy, className, children }: { busy: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className={`${buttonClass} ${className ?? "w-full"}`}>
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
