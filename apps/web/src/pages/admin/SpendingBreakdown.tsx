import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Gauge,
  Info,
  LineChart,
  Loader2,
  Repeat,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { focusRing } from "../../styles/focusRing";
import { AnimatedNumber } from "./AnimatedNumber";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { DonutChart } from "./DonutChart";
import type { CachedTransaction } from "./Statements";
import { Tooltip } from "./Tooltip";
import { TrendChart, type TrendPoint } from "./TrendChart";
import { categoryColor } from "./categoryColors";
import { currencyFormatter } from "./format";
import { plainInputClass } from "./formFields";
import type { Statement } from "./StatementRow";

interface TopMerchant {
  merchant: string;
  amount: number;
  count: number;
}

interface RecurringTxn {
  merchant: string;
  amount: number;
  date: string;
}

interface MaxTransaction {
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

type Tab = "category" | "bank" | "merchants" | "calendar";

interface DetailTransaction extends CachedTransaction {
  bank: string;
}

const iconButtonSmall = `flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--color-text-muted) hover:bg-(--color-bg) hover:text-(--color-text) ${focusRing}`;
const NEAR_LIMIT_RATIO = 0.85;

function formatPercent(value: number): string {
  return `%${Math.round(value)}`;
}

function formatDateLabel(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function SpendingBreakdown({
  total,
  transactionCount,
  byCategory,
  byBank,
  topMerchants,
  recurring,
  maxTransaction,
  pendingCount,
  onCategoryClick,
  trend,
  activeMonth,
  budgets,
  onSetBudget,
  bankLimits,
  onSetBankLimit,
  statements,
  loadTransactions,
}: {
  total: number;
  transactionCount: number;
  byCategory: Record<string, number>;
  byBank: Record<string, number>;
  topMerchants: TopMerchant[];
  recurring: RecurringTxn[];
  maxTransaction?: MaxTransaction | null;
  pendingCount: number;
  onCategoryClick: (category: string) => void;
  trend?: TrendPoint[] | null;
  activeMonth?: string | null;
  yearTotal?: number | null;
  yearOverYearTotal?: number | null;
  budgets?: Record<string, number>;
  onSetBudget?: (category: string, limit: number) => void;
  bankLimits?: Record<string, number>;
  onSetBankLimit?: (bank: string, limit: number) => void;
  statements?: Statement[];
  loadTransactions?: (statementIds: string[]) => Promise<Record<string, CachedTransaction[]>>;
}) {
  const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  const sortedBanks = Object.entries(byBank).sort(([, a], [, b]) => b - a);
  const recurringTotal = recurring.reduce((sum, t) => sum + t.amount, 0);

  const tabs: { key: Tab; label: string; count: number; visible: boolean }[] = [
    { key: "category", label: "Kategori", count: sortedCategories.length, visible: sortedCategories.length > 0 },
    { key: "bank", label: "Banka", count: sortedBanks.length, visible: sortedBanks.length > 0 },
    { key: "merchants", label: "İşyerleri", count: topMerchants.length, visible: topMerchants.length > 0 },
    { key: "calendar", label: "Takvim", count: transactionCount, visible: (statements ?? []).length > 0 },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);
  const [tab, setTab] = useState<Tab>(visibleTabs[0]?.key ?? "category");
  const [showRecurring, setShowRecurring] = useState(false);
  const [expandedRow, setExpandedRow] = useState<{ category: string; mode: "trend" | "budget" } | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<DetailTransaction[] | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Ay değişince önceki ayda mevcut olan sekme yeni ayda kaybolabilir (örn. o ay için banka
  // verisi yok) — seçili sekme artık görünmüyorsa sessizce boş bir panel göstermek yerine ilk
  // görünür sekmeye düş.
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.key === tab)) {
      setTab(visibleTabs[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs.map((t) => t.key).join(",")]);

  const doneStatements = (statements ?? []).filter((s) => s.status === "done" || s.status === "needs_review");
  const doneStatementKey = doneStatements.map((s) => `${s.statementId}:${s.bank}`).join(",");

  useEffect(() => {
    if (!detailCategory || !loadTransactions) return;
    let cancelled = false;
    setDetailTransactions(null);
    setDetailError(null);

    async function loadDetail() {
      try {
        const cache = await loadTransactions?.(doneStatements.map((s) => s.statementId));
        if (cancelled || !cache) return;
        const rows = doneStatements
          .flatMap((s) => (cache[s.statementId] ?? []).map((t) => ({ ...t, bank: s.bank })))
          .filter((t) => t.category === detailCategory && (!activeMonth || t.date.startsWith(activeMonth)))
          .sort((a, b) => b.amount - a.amount);
        setDetailTransactions(rows);
      } catch (err) {
        if (!cancelled) setDetailError(err instanceof Error ? err.message : "Kategori detayları yüklenemedi.");
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
    // loadTransactions is intentionally omitted; the parent recreates it during normal renders while
    // the cache it uses remains stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailCategory, activeMonth, doneStatementKey]);

  const barData = tab === "category" ? sortedCategories : tab === "bank" ? sortedBanks : [];
  const maxAmount = Math.max(...barData.map(([, amount]) => amount), 1);

  const activeTrendIndex = trend && activeMonth ? trend.findIndex((d) => d.month === activeMonth) : -1;
  const previousTrendPoint = activeTrendIndex > 0 ? trend?.[activeTrendIndex - 1] : null;
  const monthOverMonthChange =
    previousTrendPoint && previousTrendPoint.total > 0 && activeTrendIndex >= 0 && trend
      ? ((trend[activeTrendIndex].total - previousTrendPoint.total) / previousTrendPoint.total) * 100
      : null;

  // Sekmeden bağımsız, her zaman görünür bütçe/limit aşım uyarısı — kullanıcı "Banka" sekmesinde
  // olsa da kategori bütçesini aştığını (veya tam tersini) kaçırmasın.
  const exceededCategories = Object.entries(budgets ?? {}).filter(([category, limit]) => (byCategory[category] ?? 0) > limit);
  const exceededBanks = Object.entries(bankLimits ?? {}).filter(([bank, limit]) => (byBank[bank] ?? 0) > limit);
  const exceededNames = [...exceededCategories.map(([name]) => name), ...exceededBanks.map(([name]) => name)];
  const nearLimitCategories = Object.entries(budgets ?? {}).filter(([category, limit]) => {
    const amount = byCategory[category] ?? 0;
    return limit > 0 && amount <= limit && amount / limit >= NEAR_LIMIT_RATIO;
  });
  const nearLimitBanks = Object.entries(bankLimits ?? {}).filter(([bank, limit]) => {
    const amount = byBank[bank] ?? 0;
    return limit > 0 && amount <= limit && amount / limit >= NEAR_LIMIT_RATIO;
  });
  const nearLimitNames = [...nearLimitCategories.map(([name]) => name), ...nearLimitBanks.map(([name]) => name)];
  const maxTransactionShare = maxTransaction && total > 0 ? (maxTransaction.amount / total) * 100 : null;
  const recurringShare = total > 0 ? (recurringTotal / total) * 100 : null;

  let healthScoreRaw = 100;
  healthScoreRaw -= Math.min(36, exceededNames.length * 18);
  healthScoreRaw -= Math.min(16, nearLimitNames.length * 8);
  if (monthOverMonthChange !== null && monthOverMonthChange > 0) healthScoreRaw -= Math.min(20, monthOverMonthChange / 2);
  if (recurringShare !== null && recurringShare > 55) healthScoreRaw -= recurringShare > 70 ? 14 : 8;
  if (maxTransactionShare !== null && maxTransactionShare > 40) healthScoreRaw -= maxTransactionShare > 60 ? 16 : 10;
  const healthScore = clampScore(healthScoreRaw);
  const healthTone = healthScore >= 80 ? "good" : healthScore >= 60 ? "watch" : "risk";
  const healthLabel = healthTone === "good" ? "Sağlıklı" : healthTone === "watch" ? "Dikkat" : "Riskli";
  const healthColorClass =
    healthTone === "good"
      ? "bg-(--color-accent-soft) text-(--color-accent)"
      : healthTone === "watch"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-red-500/10 text-red-300";
  const healthReasons: string[] = [];
  if (exceededNames.length > 0) healthReasons.push("bütçe sınırı aşıldı");
  else if (nearLimitNames.length > 0) healthReasons.push("limitler sınıra yakın");
  if (monthOverMonthChange !== null && monthOverMonthChange > 15) healthReasons.push("harcama ritmi yükseldi");
  if (recurringShare !== null && recurringShare > 55) healthReasons.push("düzenli ödemeler baskın");
  if (maxTransactionShare !== null && maxTransactionShare > 40) healthReasons.push("tekil büyük harcama etkili");
  if (healthReasons.length === 0) healthReasons.push("limitler ve harcama ritmi dengeli");

  const categoryDetailTotal = detailTransactions?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const categoryDetailTopMerchants = Object.entries(
    (detailTransactions ?? []).reduce<Record<string, { amount: number; count: number }>>((acc, txn) => {
      acc[txn.merchant] = { amount: (acc[txn.merchant]?.amount ?? 0) + txn.amount, count: (acc[txn.merchant]?.count ?? 0) + 1 };
      return acc;
    }, {}),
  )
    .map(([merchant, value]) => ({ merchant, ...value }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  function toggleTrendRow(category: string) {
    setExpandedRow((prev) => (prev?.category === category && prev.mode === "trend" ? null : { category, mode: "trend" }));
  }

  function openCategoryDetail(category: string) {
    if (!loadTransactions || doneStatements.length === 0) {
      onCategoryClick(category);
      return;
    }
    setDetailCategory(category);
  }

  function toggleLimitRow(label: string, currentLimit?: number) {
    setExpandedRow((prev) => {
      if (prev?.category === label && prev.mode === "budget") return null;
      setBudgetInput(currentLimit !== undefined ? String(currentLimit) : "");
      return { category: label, mode: "budget" };
    });
  }

  function saveLimit(label: string) {
    const value = Number(budgetInput.replace(",", "."));
    if (Number.isNaN(value) || value < 0) return;
    if (tab === "category") onSetBudget?.(label, value);
    else if (tab === "bank") onSetBankLimit?.(label, value);
    setExpandedRow(null);
  }

  return (
    <div className="mb-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-5 sm:flex-nowrap">
            <DonutChart
              data={sortedCategories.map(([label, value]) => ({ label, value, color: categoryColor(label) }))}
              centerLabel={`${sortedCategories.length} kategori`}
            />
            <div className="min-w-0 flex-1">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
                <Wallet size={20} />
              </span>
              <p className="mt-2 text-xs text-(--color-text-muted)">Toplam Harcama</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  <AnimatedNumber value={currencyFormatter.format(total)} />
                </p>
                {monthOverMonthChange !== null && (
                  <Tooltip label="Önceki aya göre değişim">
                    <span
                      className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        monthOverMonthChange > 0 ? "bg-red-500/10 text-red-400" : "bg-(--color-accent-soft) text-(--color-accent)"
                      }`}
                    >
                      {monthOverMonthChange > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      %{Math.abs(monthOverMonthChange).toFixed(0)}
                    </span>
                  </Tooltip>
                )}
              </div>

              {recurringTotal > 0 && (
                <button
                  onClick={() => setShowRecurring((v) => !v)}
                  className={`mt-1 flex items-center gap-1 text-xs text-(--color-text-muted) hover:text-(--color-text) ${focusRing}`}
                >
                  <Repeat size={11} />
                  Bunun {currencyFormatter.format(recurringTotal)} tutarı düzenli ödemeler
                  <motion.span animate={{ rotate: showRecurring ? 180 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronDown size={12} />
                  </motion.span>
                </button>
              )}
              <AnimatePresence initial={false}>
                {showRecurring && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 flex max-w-md flex-col gap-1 overflow-hidden text-sm text-(--color-text-muted)"
                  >
                    {recurring.map((txn, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">{txn.merchant}</span>
                        <span className="shrink-0 tabular-nums">{currencyFormatter.format(txn.amount)}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="min-w-0 border-t border-(--color-border) pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold tabular-nums ${healthColorClass}`}>
              {healthScore}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Gauge size={14} className="text-(--color-text-muted)" />
                Harcama sağlığı: {healthLabel}
              </p>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">{healthReasons.join(" · ")}</p>
            </div>
          </div>
          {trend && trend.length > 1 && (
            <div className="mt-5 border-t border-(--color-border) pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">Son {trend.length} Ay</p>
              <TrendChart data={trend} activeMonth={activeMonth ?? null} />
            </div>
          )}
        </div>
      </div>

      {pendingCount > 0 && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-(--color-bg) px-3 py-2 text-xs text-(--color-text-muted)">
          <Loader2 size={12} className="animate-spin" />
          {pendingCount} ekstre işleniyor — toplam güncellenecek.
        </p>
      )}

      {visibleTabs.length > 1 && (
        <div className="mb-3 flex gap-1 rounded-lg bg-(--color-bg) p-1 text-sm">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-label={t.label}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${focusRing} ${
                tab === t.key ? "bg-(--color-accent-soft) text-(--color-accent)" : "text-(--color-text-muted) hover:text-(--color-text)"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {t.label}
                <span className="rounded-full bg-(--color-surface) px-1.5 py-0.5 text-[10px] tabular-nums text-(--color-text-muted)">{t.count}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {(tab === "category" || tab === "bank") && (
        <div className="flex flex-col gap-1">
          <div className="mb-1 hidden grid-cols-[minmax(120px,0.75fr)_minmax(160px,1.6fr)_minmax(190px,0.9fr)] gap-3 pr-14 pl-1.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-text-muted) sm:grid">
            <span>{tab === "category" ? "Kategori" : "Banka"}</span>
            <span>Kullanım</span>
            <span className="text-right">Tutar / Limit</span>
          </div>
          {barData.map(([label, amount]) => {
            const color = categoryColor(label);
            const percent = total > 0 ? (amount / total) * 100 : 0;
            const limit = tab === "category" ? budgets?.[label] : tab === "bank" ? bankLimits?.[label] : undefined;
            const overLimit = limit !== undefined && amount > limit;
            const limitPercent = limit !== undefined && limit > 0 ? (amount / limit) * 100 : null;
            const limitUsageText =
              limit !== undefined && limitPercent !== null
                ? `${currencyFormatter.format(amount)} / ${currencyFormatter.format(limit)} · ${formatPercent(limitPercent)}`
                : null;
            const canEditLimit = (tab === "category" && onSetBudget) || (tab === "bank" && onSetBankLimit);
            const row = (
              <div className="grid min-h-9 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(120px,0.75fr)_minmax(160px,1.6fr)_minmax(190px,0.9fr)]">
                <span className="order-1 min-w-0 truncate text-left text-(--color-text-muted) sm:order-none">{label}</span>
                <div className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-(--color-bg) sm:order-none sm:col-span-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(amount / maxAmount) * 100}%`, backgroundColor: overLimit ? "#f87171" : color }}
                  />
                </div>
                <span
                  title={limitUsageText ?? currencyFormatter.format(amount)}
                  className={`order-2 whitespace-nowrap text-right text-[11px] tabular-nums sm:order-none sm:text-xs ${overLimit ? "font-semibold text-red-400" : ""}`}
                >
                  {limitUsageText ?? currencyFormatter.format(amount)}
                </span>
              </div>
            );
            const tooltipLabel = `${currencyFormatter.format(amount)} · toplamın %${percent.toFixed(0)}'i${
              limitUsageText ? ` · ${limitUsageText}` : ""
            }${tab === "category" ? " — detay panelini açın" : ""}`;

            return (
              <div key={label}>
                <div className="flex items-center gap-1.5">
                  <Tooltip label={tooltipLabel} className="relative flex min-w-0 flex-1">
                    {tab === "category" ? (
                      <button
                        onClick={() => openCategoryDetail(label)}
                        aria-label={`${label} kategori detayını aç`}
                        className={`block w-full flex-1 rounded-lg text-left transition-colors hover:bg-(--color-bg) ${focusRing}`}
                      >
                        {row}
                      </button>
                    ) : (
                      <div className="flex-1 cursor-default">{row}</div>
                    )}
                  </Tooltip>
                  {tab === "category" && trend && trend.length > 1 && (
                    <Tooltip label="Kategori trendini gör">
                      <button onClick={() => toggleTrendRow(label)} className={iconButtonSmall} aria-label={`${label} trendini gör`}>
                        <LineChart size={12} />
                      </button>
                    </Tooltip>
                  )}
                  {canEditLimit && (
                    <Tooltip
                      label={
                        limit !== undefined
                          ? `Limit: ${currencyFormatter.format(limit)}`
                          : tab === "category"
                            ? "Bütçe belirle"
                            : "Kart limiti belirle"
                      }
                    >
                      <button
                        onClick={() => toggleLimitRow(label, limit)}
                        className={iconButtonSmall}
                        aria-label={tab === "category" ? `${label} bütçesini belirle` : `${label} limitini belirle`}
                      >
                        <Target size={12} />
                      </button>
                    </Tooltip>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {expandedRow?.category === label && expandedRow.mode === "budget" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1.5 flex items-center gap-2 pb-1 pl-1">
                        <input
                          type="number"
                          min="0"
                          placeholder={tab === "category" ? "Aylık bütçe (TL)" : "Aylık kart limiti (TL)"}
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          className={`${plainInputClass} w-32`}
                        />
                        <Tooltip label="Kaydet">
                          <button onClick={() => saveLimit(label)} className={iconButtonSmall} aria-label="Kaydet">
                            <Check size={13} />
                          </button>
                        </Tooltip>
                        {limit !== undefined && (
                          <Tooltip label="Kaldır">
                            <button
                              onClick={() => {
                                if (tab === "category") onSetBudget?.(label, 0);
                                else if (tab === "bank") onSetBankLimit?.(label, 0);
                                setExpandedRow(null);
                              }}
                              className={iconButtonSmall}
                              aria-label="Kaldır"
                            >
                              <Trash2 size={13} />
                            </button>
                          </Tooltip>
                        )}
                        <button onClick={() => setExpandedRow(null)} className={iconButtonSmall} aria-label="Vazgeç">
                          <X size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {expandedRow?.category === label && expandedRow.mode === "trend" && trend && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pb-1 pl-1 pr-8">
                        <TrendChart data={trend.map((t) => ({ ...t, total: t.byCategory[label] ?? 0 }))} activeMonth={activeMonth ?? null} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {tab === "merchants" && (
        <ol className="flex flex-col gap-2 text-sm">
          {topMerchants.map((m, i) => (
            <li key={m.merchant} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-bg) text-xs font-semibold text-(--color-text-muted)">
                {i + 1}
              </span>
              <span className="flex-1 truncate">{m.merchant}</span>
              <span className="text-xs text-(--color-text-muted)">{m.count} işlem</span>
              <span className="w-24 shrink-0 text-right font-medium tabular-nums">{currencyFormatter.format(m.amount)}</span>
            </li>
          ))}
        </ol>
      )}

      {tab === "calendar" && loadTransactions && (
        <CalendarHeatmap statements={statements ?? []} month={activeMonth ?? null} loadTransactions={loadTransactions} />
      )}

      <AnimatePresence>
        {detailCategory && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              aria-label="Kategori detayını kapat"
              onClick={() => setDetailCategory(null)}
              className="absolute inset-0 bg-black/45"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`${detailCategory} kategori detayı`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-(--color-border) bg-(--color-surface) p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="mb-2 inline-flex h-2 w-10 rounded-full"
                    style={{ backgroundColor: categoryColor(detailCategory) }}
                    aria-hidden="true"
                  />
                  <h2 className="font-heading text-xl font-semibold">{detailCategory}</h2>
                  <p className="text-sm text-(--color-text-muted)">Kategori detayı</p>
                </div>
                <button onClick={() => setDetailCategory(null)} className={iconButtonSmall} aria-label="Kapat">
                  <X size={14} />
                </button>
              </div>

              {detailError && (
                <p className="mt-5 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <AlertTriangle size={14} />
                  {detailError}
                </p>
              )}

              {!detailError && detailTransactions === null && (
                <p className="mt-5 flex items-center gap-1.5 text-sm text-(--color-text-muted)">
                  <Loader2 size={14} className="animate-spin" />
                  Detaylar yükleniyor...
                </p>
              )}

              {!detailError && detailTransactions !== null && (
                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <div className="grid grid-cols-2 gap-3 border-y border-(--color-border) py-4">
                    <div>
                      <p className="text-xs text-(--color-text-muted)">Toplam</p>
                      <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{currencyFormatter.format(categoryDetailTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--color-text-muted)">İşlem</p>
                      <p className="mt-1 font-heading text-lg font-semibold tabular-nums">{detailTransactions.length}</p>
                    </div>
                  </div>

                  {trend && trend.length > 1 && (
                    <div className="border-b border-(--color-border) py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">Kategori Trendi</p>
                      <TrendChart data={trend.map((t) => ({ ...t, total: t.byCategory[detailCategory] ?? 0 }))} activeMonth={activeMonth ?? null} />
                    </div>
                  )}

                  {categoryDetailTopMerchants.length > 0 && (
                    <div className="border-b border-(--color-border) py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">En Büyük İşyerleri</p>
                      <ol className="flex flex-col gap-2 text-sm">
                        {categoryDetailTopMerchants.map((merchant, i) => (
                          <li key={merchant.merchant} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-bg) text-xs text-(--color-text-muted)">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{merchant.merchant}</span>
                            <span className="text-xs text-(--color-text-muted)">{merchant.count} işlem</span>
                            <span className="font-medium tabular-nums">{currencyFormatter.format(merchant.amount)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {detailTransactions.length === 0 ? (
                    <p className="mt-4 flex items-center gap-1.5 text-sm text-(--color-text-muted)">
                      <Info size={14} />
                      Bu ayda bu kategoriye ait işlem bulunamadı.
                    </p>
                  ) : (
                    <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1 text-sm">
                      {detailTransactions.map((txn) => (
                        <li key={txn.txnId} className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1.5 hover:bg-(--color-bg)">
                          <span className="min-w-0">
                            <span className="block truncate">{txn.merchant}</span>
                            <span className="text-xs text-(--color-text-muted)">
                              {formatDateLabel(txn.date)} · {txn.bank}
                            </span>
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">{currencyFormatter.format(txn.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => {
                      onCategoryClick(detailCategory);
                      setDetailCategory(null);
                    }}
                    className={`mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-(--color-accent-soft) px-3 py-2 text-sm font-medium text-(--color-accent) ${focusRing}`}
                  >
                    Tüm işlemlerde aç <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
