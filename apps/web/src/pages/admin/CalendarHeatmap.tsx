import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "./Tooltip";
import { currencyFormatter } from "./format";
import type { CachedTransaction } from "./Statements";
import type { Statement } from "./StatementRow";

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

interface CalendarTransaction extends CachedTransaction {
  bank: string;
}

export function CalendarHeatmap({
  statements,
  month,
  loadTransactions,
}: {
  statements: Statement[];
  month: string | null;
  loadTransactions: (statementIds: string[]) => Promise<Record<string, CachedTransaction[]>>;
}) {
  const [dailyTransactions, setDailyTransactions] = useState<Record<string, CalendarTransaction[]> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doneStatementIds = useMemo(
    () => statements.filter((s) => s.status === "done" || s.status === "needs_review").map((s) => s.statementId),
    [statements],
  );

  useEffect(() => {
    if (!month) return;
    const activeMonth = month;
    let cancelled = false;
    setDailyTransactions(null);
    setSelectedDate(null);

    async function load() {
      try {
        const cache = await loadTransactions(doneStatementIds);
        if (cancelled) return;
        const byDate: Record<string, CalendarTransaction[]> = {};
        const bankByStatement = Object.fromEntries(statements.map((statement) => [statement.statementId, statement.bank]));
        for (const id of doneStatementIds) {
          for (const t of cache[id] ?? []) {
            if (!t.date.startsWith(activeMonth)) continue;
            byDate[t.date] = [...(byDate[t.date] ?? []), { ...t, bank: bankByStatement[id] ?? "Bilinmiyor" }];
          }
        }
        setDailyTransactions(byDate);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Günlük veriler yüklenemedi.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneStatementIds.join(","), month]);

  if (!month) return null;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (dailyTransactions === null) return <p className="text-sm text-(--color-text-muted)">Yükleniyor...</p>;

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstWeekday = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7; // Pazartesi = 0
  const dailyTotals = Object.fromEntries(Object.entries(dailyTransactions).map(([date, txns]) => [date, txns.reduce((sum, txn) => sum + txn.amount, 0)]));
  const max = Math.max(...Object.values(dailyTotals), 1);

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];

  if (Object.keys(dailyTransactions).length === 0) {
    return <p className="text-sm text-(--color-text-muted)">Bu ay için günlük işlem bulunamadı.</p>;
  }

  const selectedTransactions = selectedDate ? [...(dailyTransactions[selectedDate] ?? [])].sort((a, b) => b.amount - a.amount) : [];
  const selectedTotal = selectedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const activeDayTotals = Object.values(dailyTotals).filter((amount) => amount > 0);
  const averageActiveDay = activeDayTotals.reduce((sum, amount) => sum + amount, 0) / activeDayTotals.length;
  const largestSelected = selectedTransactions[0];
  const selectedExplanation =
    selectedTotal >= averageActiveDay * 1.75
      ? "Bu gün, harcama yapılan günlerin ortalamasının belirgin üstünde."
      : selectedTotal >= averageActiveDay * 1.2
        ? "Bu gün ortalamanın üzerinde; ana etki büyük tekil işlem olabilir."
        : "Bu gün harcama yapılan gün ortalamasına yakın.";

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[10px] text-(--color-text-muted)">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />;
          const amount = dailyTotals[date] ?? 0;
          const intensity = amount > 0 ? Math.max(amount / max, 0.18) : 0;
          const day = Number(date.slice(-2));
          return (
            <Tooltip key={date} label={amount > 0 ? `${date} · ${currencyFormatter.format(amount)}` : date}>
              <button
                type="button"
                onClick={() => amount > 0 && setSelectedDate(date)}
                disabled={amount === 0}
                aria-label={amount > 0 ? `${date} işlemlerini göster` : date}
                className={`flex aspect-square items-center justify-center rounded-md text-[10px] transition-transform ${
                  amount === 0 ? "bg-(--color-bg)" : selectedDate === date ? "ring-2 ring-(--color-accent)" : "hover:scale-[1.03]"
                }`}
                style={amount > 0 ? { backgroundColor: `rgba(52, 211, 153, ${intensity})` } : undefined}
              >
                <span className={amount > max * 0.6 ? "font-semibold text-black" : "text-(--color-text-muted)"}>{day}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {selectedDate && selectedTransactions.length > 0 && (
        <div className="mt-4 border-t border-(--color-border) pt-3 text-sm">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{new Date(selectedDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "long" })}</p>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                {selectedExplanation}
                {largestSelected ? ` En büyük işlem: ${largestSelected.merchant}.` : ""}
              </p>
            </div>
            <span className="shrink-0 font-medium tabular-nums">{currencyFormatter.format(selectedTotal)}</span>
          </div>
          <ul className="flex max-h-36 flex-col gap-1.5 overflow-y-auto">
            {selectedTransactions.map((txn) => (
              <li key={txn.txnId} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-(--color-bg)">
                <span className="min-w-0">
                  <span className="block truncate">{txn.merchant}</span>
                  <span className="text-xs text-(--color-text-muted)">
                    {txn.category} · {txn.bank}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{currencyFormatter.format(txn.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
