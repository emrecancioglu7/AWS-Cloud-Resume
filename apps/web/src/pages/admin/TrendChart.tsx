import { Tooltip } from "./Tooltip";
import { currencyFormatter } from "./format";

export interface TrendPoint {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  transactionCount: number;
}

export function monthShortLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", { month: "short" });
}

export function TrendChart({ data, activeMonth }: { data: TrendPoint[]; activeMonth: string | null }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex w-full items-end gap-2">
      {data.map((d) => {
        const isActive = d.month === activeMonth;
        const heightPercent = Math.max((d.total / max) * 100, 4);
        return (
          <div key={d.month} className="min-w-0 flex-1">
            <Tooltip label={`${monthShortLabel(d.month)} · ${currencyFormatter.format(d.total)}`}>
              <div className="flex w-full flex-col items-center gap-1.5">
                <div className="flex h-12 w-full items-end">
                  <div
                    className={`w-full rounded-t-sm transition-colors ${isActive ? "bg-(--color-accent)" : "bg-(--color-border)"}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-[10px] ${isActive ? "font-semibold text-(--color-accent)" : "text-(--color-text-muted)"}`}>
                  {monthShortLabel(d.month)}
                </span>
              </div>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
