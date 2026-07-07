import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownAZ, Hash, Plus, Search, Tag, Wallet, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { AdminLayout } from "./AdminLayout";
import { FundRow, type ProfitLoss } from "./FundRow";
import { SkeletonRows } from "./Skeleton";
import { useToast } from "./Toast";
import { currencyFormatter } from "./format";
import { IconField, SubmitButton, buttonClass, plainInputClass } from "./formFields";

interface FundSummary {
  fundCode: string;
  name: string;
  netUnits: number;
  latestPrice: number | null;
  latestPriceDate: string | null;
  currentValue: number | null;
}

interface TransactionItem {
  type: "BUY" | "SELL";
  units: number;
  price: number;
}

type SortBy = "value" | "name";

export function AdminDashboard() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const [funds, setFunds] = useState<FundSummary[] | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profitLoss, setProfitLoss] = useState<Record<string, ProfitLoss>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [fundCode, setFundCode] = useState("");
  const [fundName, setFundName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("value");

  async function loadProfitLoss(summaryFunds: FundSummary[]) {
    const entries = await Promise.all(
      summaryFunds.map(async (fund) => {
        try {
          const { transactions } = await apiFetch<{ transactions: TransactionItem[] }>(getIdToken, `/funds/${fund.fundCode}/transactions`);
          const netInvested = transactions.reduce((sum, t) => sum + (t.type === "BUY" ? 1 : -1) * t.units * t.price, 0);
          if (fund.currentValue === null || netInvested === 0) return [fund.fundCode, null] as const;
          const amount = fund.currentValue - netInvested;
          return [fund.fundCode, { amount, percent: (amount / netInvested) * 100 }] as const;
        } catch {
          return [fund.fundCode, null] as const;
        }
      }),
    );
    setProfitLoss(Object.fromEntries(entries.filter(([, value]) => value !== null)) as Record<string, ProfitLoss>);
  }

  async function loadSummary() {
    setError(null);
    try {
      const data = await apiFetch<{ funds: FundSummary[]; totalValue: number }>(getIdToken, "/portfolio/summary");
      setFunds(data.funds);
      setTotalValue(data.totalValue);
      loadProfitLoss(data.funds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portföy yüklenemedi.");
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "Escape" && showAddForm) {
        setShowAddForm(false);
      } else if (!isTyping && (e.key === "n" || e.key === "N") && !showAddForm) {
        e.preventDefault();
        setShowAddForm(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAddForm]);

  async function handleAddFund(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setBusy(true);
    try {
      await apiFetch(getIdToken, "/funds", { method: "POST", body: JSON.stringify({ fundCode, name: fundName }) });
      setFundCode("");
      setFundName("");
      setShowAddForm(false);
      showToast("Fon eklendi.");
      await loadSummary();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Fon eklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  const visibleFunds = useMemo(() => {
    if (!funds) return [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? funds.filter((f) => f.fundCode.toLowerCase().includes(query) || f.name.toLowerCase().includes(query))
      : funds;
    return [...filtered].sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name, "tr") : (b.currentValue ?? 0) - (a.currentValue ?? 0),
    );
  }, [funds, searchQuery, sortBy]);

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
          <Wallet size={20} />
        </span>
        <div>
          <p className="text-xs text-(--color-text-muted)">Toplam Değer</p>
          <p className="font-heading text-2xl font-semibold tabular-nums">{currencyFormatter.format(totalValue)}</p>
        </div>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-(--color-text-muted)">Fonlar</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`${buttonClass} w-auto bg-(--color-accent-soft) px-3 py-1.5 text-xs text-(--color-accent) hover:opacity-80`}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? "Vazgeç" : "Yeni Fon"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showAddForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAddFund}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-(--color-text-muted)">Fon Kodu</label>
                <IconField
                  icon={<Hash size={14} />}
                  type="text"
                  required
                  autoFocus
                  placeholder="örn. AFA"
                  value={fundCode}
                  onChange={(e) => setFundCode(e.target.value)}
                  className="w-32 rounded-lg border border-(--color-border) bg-(--color-bg) py-2 pl-9 pr-3 text-sm text-(--color-text) uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-(--color-text-muted)">Fon Adı</label>
                <IconField
                  icon={<Tag size={14} />}
                  type="text"
                  required
                  placeholder="örn. Ak Portföy Alternatif Enerji Fonu"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full rounded-lg border border-(--color-border) bg-(--color-bg) py-2 pl-9 pr-3 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                />
              </div>
              <SubmitButton busy={busy} className="w-auto px-4">
                <Plus size={15} /> Ekle
              </SubmitButton>
            </div>
            {addError && <p className="mt-2 text-sm text-red-400">{addError}</p>}
          </motion.form>
        )}
      </AnimatePresence>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {!error && funds === null && <SkeletonRows count={3} />}

      {funds !== null && funds.length === 0 && (
        <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-10 text-center text-sm text-(--color-text-muted)">
          Henüz fon eklenmedi — "Yeni Fon" ile ilk fonunuzu ekleyin.
        </p>
      )}

      {funds !== null && funds.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="relative flex-1">
              <Search size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-(--color-text-muted)" />
              <input
                type="text"
                placeholder="Fon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${plainInputClass} w-full pl-9`}
              />
            </span>
            <span className="relative">
              <ArrowDownAZ size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-(--color-text-muted)" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className={`${plainInputClass} pl-9`}>
                <option value="value">Değere göre</option>
                <option value="name">Ada göre</option>
              </select>
            </span>
          </div>

          {visibleFunds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-8 text-center text-sm text-(--color-text-muted)">
              "{searchQuery}" ile eşleşen fon bulunamadı.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleFunds.map((fund) => (
                <FundRow key={fund.fundCode} fund={fund} onChanged={loadSummary} profitLoss={profitLoss[fund.fundCode] ?? null} />
              ))}
            </ul>
          )}
        </>
      )}
    </AdminLayout>
  );
}
