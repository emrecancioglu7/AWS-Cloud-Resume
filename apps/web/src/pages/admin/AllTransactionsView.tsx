import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownAZ, Download, Repeat, Search } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { CategoryPicker } from "./CategoryPicker";
import type { CachedTransaction } from "./Statements";
import { useToast } from "./Toast";
import { Tooltip } from "./Tooltip";
import { categoryColor } from "./categoryColors";
import { currencyFormatter } from "./format";
import { plainInputClass } from "./formFields";
import type { Statement } from "./StatementRow";

interface MergedTransaction extends CachedTransaction {
  bank: string;
}

type SortBy = "date" | "amount";
const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

function needsCategoryReview(txn: CachedTransaction): boolean {
  return typeof txn.categoryConfidence === "number" && txn.categoryConfidence < REVIEW_CONFIDENCE_THRESHOLD;
}

function formatConfidence(value: number): string {
  return `%${Math.round(value * 100)}`;
}

function downloadCsv(rows: MergedTransaction[], filename: string) {
  const header = ["Tarih", "İşyeri", "Kategori", "Banka", "Tutar", "Düzenli mi"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((t) => [t.date, escape(t.merchant), escape(t.category), escape(t.bank), t.amount.toFixed(2), t.isRecurring ? "Evet" : "Hayır"].join(",")),
  ];
  const blob = new Blob([`﻿${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AllTransactionsView({
  statements,
  monthFilter,
  initialCategory,
  onCategoryChanged,
  loadTransactions,
}: {
  statements: Statement[];
  monthFilter: string | null;
  initialCategory?: string;
  onCategoryChanged?: (statementIds: string | string[]) => void;
  loadTransactions: (statementIds: string[]) => Promise<Record<string, CachedTransaction[]>>;
}) {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<MergedTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "Tümü");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);

  const doneStatements = useMemo(() => statements.filter((s) => s.status === "done" || s.status === "needs_review"), [statements]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const cache = await loadTransactions(doneStatements.map((s) => s.statementId));
        if (cancelled) return;
        const merged = doneStatements.flatMap((s) => (cache[s.statementId] ?? []).map((t) => ({ ...t, bank: s.bank })));
        setTransactions(merged);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "İşlemler yüklenemedi.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneStatements.map((s) => s.statementId).join(",")]);

  const usingCustomRange = dateFrom !== "" || dateTo !== "";

  // Özel tarih aralığı belirtildiğinde ay filtresini görmezden gelir — aksi halde aralık ayın
  // sınırlarıyla anlamsızca kesilir.
  const scoped = useMemo(() => {
    if (!transactions) return [];
    if (usingCustomRange) {
      return transactions.filter((t) => (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo));
    }
    return monthFilter ? transactions.filter((t) => t.date.startsWith(monthFilter)) : transactions;
  }, [transactions, monthFilter, usingCustomRange, dateFrom, dateTo]);

  const categories = useMemo(() => Array.from(new Set(scoped.map((t) => t.category))).sort(), [scoped]);
  const reviewCount = useMemo(() => scoped.filter(needsCategoryReview).length, [scoped]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scoped
      .filter(
        (t) =>
          (category === "Tümü" || t.category === category) &&
          (!reviewOnly || needsCategoryReview(t)) &&
          (!query || t.merchant.toLowerCase().includes(query)),
      )
      .sort((a, b) => (sortBy === "amount" ? b.amount - a.amount : b.date.localeCompare(a.date)));
  }, [scoped, search, category, reviewOnly, sortBy]);

  const filteredTotal = filtered.reduce((sum, t) => sum + t.amount, 0);

  async function handleCategoryChange(txn: MergedTransaction, next: string) {
    setTransactions((prev) => prev?.map((t) => (t.merchant === txn.merchant ? { ...t, category: next, categoryConfidence: 1 } : t)) ?? null);
    try {
      const result = await apiFetch<{ category: string; updatedTransactions?: number; affectedStatementIds?: string[] }>(
        getIdToken,
        `/statements/${txn.statementId}/transactions/${txn.txnId}`,
        {
          method: "PUT",
          body: JSON.stringify({ category: next }),
        },
      );
      const updatedCount = result.updatedTransactions ?? 1;
      showToast(updatedCount > 1 ? `${updatedCount} işlem güncellendi.` : "Kategori güncellendi.");
      onCategoryChanged?.(result.affectedStatementIds?.length ? result.affectedStatementIds : txn.statementId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Kategori güncellenemedi.", "error");
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      showToast("Dışa aktarılacak işlem yok.", "error");
      return;
    }
    downloadCsv(filtered, `harcamalar-${monthFilter ?? "tum-zamanlar"}.csv`);
  }

  if (error) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>;
  if (transactions === null) return <p className="text-sm text-(--color-text-muted)">Yükleniyor...</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-(--color-text-muted)" />
          <input
            type="text"
            placeholder="Mağaza ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${plainInputClass} w-full pl-9`}
          />
        </span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Başlangıç tarihi"
          className={plainInputClass}
        />
        <span className="text-xs text-(--color-text-muted)">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Bitiş tarihi" className={plainInputClass} />
        <Tooltip label={sortBy === "date" ? "Tutara göre sırala" : "Tarihe göre sırala"}>
          <button
            onClick={() => setSortBy((prev) => (prev === "date" ? "amount" : "date"))}
            className={`flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text) ${focusRing}`}
          >
            <ArrowDownAZ size={14} />
            {sortBy === "date" ? "Tarih" : "Tutar"}
          </button>
        </Tooltip>
        <Tooltip label="CSV olarak dışa aktar">
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text) ${focusRing}`}
          >
            <Download size={14} />
            CSV
          </button>
        </Tooltip>
      </div>

      {usingCustomRange && (
        <button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className={`self-start text-xs text-(--color-accent) hover:underline ${focusRing}`}
        >
          Özel aralığı temizle, seçili aya dön
        </button>
      )}

      <div className="flex flex-wrap gap-1.5">
        {reviewCount > 0 && (
          <button
            onClick={() => setReviewOnly((value) => !value)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${
              reviewOnly ? "bg-amber-500/10 text-amber-300" : "bg-(--color-bg) text-(--color-text-muted)"
            }`}
          >
            <AlertTriangle size={12} />
            Kontrol edilmeli ({reviewCount})
          </button>
        )}
        <button
          onClick={() => setCategory("Tümü")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${
            category === "Tümü" ? "bg-(--color-accent-soft) text-(--color-accent)" : "bg-(--color-bg) text-(--color-text-muted)"
          }`}
        >
          Tümü
        </button>
        {categories.map((c) => {
          const color = categoryColor(c);
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${focusRing}`}
              style={active ? { backgroundColor: `${color}22`, color } : { color: "var(--color-text-muted)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {c}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-8 text-center text-sm text-(--color-text-muted)">
          Eşleşen işlem bulunamadı.
        </p>
      ) : (
        <>
          <ul className="flex max-h-96 flex-col gap-1.5 overflow-y-auto text-sm">
            {filtered.map((t) => (
              <li key={t.txnId} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 hover:bg-(--color-bg)">
                <span className="flex items-center gap-2 text-(--color-text-muted)">
                  <span className="text-xs">{t.date}</span>
                  {t.merchant}
                  {t.isRecurring && (
                    <Tooltip label="Düzenli ödeme">
                      <Repeat size={11} aria-label="Düzenli ödeme" className="text-(--color-text-muted)" />
                    </Tooltip>
                  )}
                  <span className="text-xs text-(--color-text-muted)">· {t.bank}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CategoryPicker value={t.category} color={categoryColor(t.category)} onChange={(next) => handleCategoryChange(t, next)} />
                  {needsCategoryReview(t) && (
                    <Tooltip label={`AI kategori güveni düşük: ${formatConfidence(t.categoryConfidence ?? 0)}`}>
                      <AlertTriangle size={12} aria-label="Kategori kontrol edilmeli" className="shrink-0 text-amber-300" />
                    </Tooltip>
                  )}
                  <span className="tabular-nums font-medium">{currencyFormatter.format(t.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-(--color-border) pt-2 text-xs text-(--color-text-muted)">
            <span>{filtered.length} işlem</span>
            <span className="font-medium tabular-nums">{currencyFormatter.format(filteredTotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}
