import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, ChevronDown, Pencil, Plus, Receipt, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./Toast";
import { Tooltip } from "./Tooltip";
import { currencyFormatter, numberFormatter } from "./format";
import { SubmitButton, iconButtonClass, plainInputClass } from "./formFields";

const UNDO_DELAY_MS = 4000;

interface FundSummary {
  fundCode: string;
  name: string;
  netUnits: number;
  latestPrice: number | null;
  latestPriceDate: string | null;
  currentValue: number | null;
}

interface PriceItem {
  date: string;
  price: number;
}

interface TransactionItem {
  txnId: string;
  date: string;
  type: "BUY" | "SELL";
  units: number;
  price: number;
}

export interface ProfitLoss {
  amount: number;
  percent: number | null;
}

function isValidDecimal(value: string): boolean {
  if (!value) return true;
  return !Number.isNaN(Number(value.replace(",", ".")));
}

export function FundRow({ fund, onChanged, profitLoss }: { fund: FundSummary; onChanged: () => void; profitLoss?: ProfitLoss | null }) {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const pendingPriceDeletes = useRef(new Map<string, { item: PriceItem; timeoutId: ReturnType<typeof setTimeout> }>());
  const pendingTxnDeletes = useRef(new Map<string, { item: TransactionItem; timeoutId: ReturnType<typeof setTimeout> }>());

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(fund.name);
  const [savingName, setSavingName] = useState(false);

  const [prices, setPrices] = useState<PriceItem[] | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [priceDate, setPriceDate] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [priceBusy, setPriceBusy] = useState(false);

  const [txnDate, setTxnDate] = useState("");
  const [txnType, setTxnType] = useState<"BUY" | "SELL">("BUY");
  const [txnUnits, setTxnUnits] = useState("");
  const [txnPrice, setTxnPrice] = useState("");
  const [txnBusy, setTxnBusy] = useState(false);

  async function loadDetails() {
    setLoadError(null);
    try {
      const [priceData, txnData] = await Promise.all([
        apiFetch<{ prices: PriceItem[] }>(getIdToken, `/funds/${fund.fundCode}/prices`),
        apiFetch<{ transactions: TransactionItem[] }>(getIdToken, `/funds/${fund.fundCode}/transactions`),
      ]);
      setPrices(priceData.prices);
      setTransactions(txnData.transactions);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Detaylar yüklenemedi.");
    }
  }

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && prices === null) loadDetails();
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === fund.name) {
      setEditingName(false);
      setNameInput(fund.name);
      return;
    }
    setSavingName(true);
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}`, { method: "PUT", body: JSON.stringify({ name: trimmed }) });
      setEditingName(false);
      showToast("Fon adı güncellendi.");
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Güncellenemedi.", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteFund() {
    const ok = await confirm({
      title: "Fonu sil",
      description: `${fund.fundCode} fonunu ve tüm fiyat/işlem geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    });
    if (!ok) return;
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}`, { method: "DELETE" });
      showToast("Fon silindi.");
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
    }
  }

  async function handleAddPrice(e: FormEvent) {
    e.preventDefault();
    if (!isValidDecimal(priceValue)) {
      showToast("Geçersiz fiyat değeri.", "error");
      return;
    }
    setPriceBusy(true);
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}/prices`, {
        method: "POST",
        body: JSON.stringify({ date: priceDate, price: Number(priceValue.replace(",", ".")) }),
      });
      setPriceDate("");
      setPriceValue("");
      showToast("Fiyat eklendi.");
      await loadDetails();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Fiyat eklenemedi.", "error");
    } finally {
      setPriceBusy(false);
    }
  }

  function handleDeletePrice(date: string) {
    const item = prices?.find((p) => p.date === date);
    if (!item) return;
    setPrices((prev) => prev?.filter((p) => p.date !== date) ?? null);

    const timeoutId = setTimeout(async () => {
      pendingPriceDeletes.current.delete(date);
      try {
        await apiFetch(getIdToken, `/funds/${fund.fundCode}/prices/${date}`, { method: "DELETE" });
        onChanged();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
        setPrices((prev) => (prev ? [...prev, item].sort((a, b) => a.date.localeCompare(b.date)) : prev));
      }
    }, UNDO_DELAY_MS);
    pendingPriceDeletes.current.set(date, { item, timeoutId });

    showToast(`${date} tarihli fiyat silindi.`, "success", {
      durationMs: UNDO_DELAY_MS,
      action: {
        label: "Geri al",
        onClick: () => {
          const pending = pendingPriceDeletes.current.get(date);
          if (!pending) return;
          clearTimeout(pending.timeoutId);
          pendingPriceDeletes.current.delete(date);
          setPrices((prev) => (prev ? [...prev, pending.item].sort((a, b) => a.date.localeCompare(b.date)) : prev));
        },
      },
    });
  }

  async function handleAddTransaction(e: FormEvent) {
    e.preventDefault();
    if (!isValidDecimal(txnUnits) || !isValidDecimal(txnPrice)) {
      showToast("Geçersiz adet veya fiyat değeri.", "error");
      return;
    }
    setTxnBusy(true);
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}/transactions`, {
        method: "POST",
        body: JSON.stringify({ date: txnDate, type: txnType, units: Number(txnUnits.replace(",", ".")), price: Number(txnPrice.replace(",", ".")) }),
      });
      setTxnDate("");
      setTxnUnits("");
      setTxnPrice("");
      showToast("İşlem eklendi.");
      await loadDetails();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "İşlem eklenemedi.", "error");
    } finally {
      setTxnBusy(false);
    }
  }

  function handleDeleteTransaction(txnId: string) {
    const item = transactions?.find((t) => t.txnId === txnId);
    if (!item) return;
    setTransactions((prev) => prev?.filter((t) => t.txnId !== txnId) ?? null);

    const timeoutId = setTimeout(async () => {
      pendingTxnDeletes.current.delete(txnId);
      try {
        await apiFetch(getIdToken, `/funds/${fund.fundCode}/transactions/${txnId}`, { method: "DELETE" });
        onChanged();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
        setTransactions((prev) => (prev ? [...prev, item].sort((a, b) => a.date.localeCompare(b.date)) : prev));
      }
    }, UNDO_DELAY_MS);
    pendingTxnDeletes.current.set(txnId, { item, timeoutId });

    showToast("İşlem silindi.", "success", {
      durationMs: UNDO_DELAY_MS,
      action: {
        label: "Geri al",
        onClick: () => {
          const pending = pendingTxnDeletes.current.get(txnId);
          if (!pending) return;
          clearTimeout(pending.timeoutId);
          pendingTxnDeletes.current.delete(txnId);
          setTransactions((prev) => (prev ? [...prev, pending.item].sort((a, b) => a.date.localeCompare(b.date)) : prev));
        },
      },
    });
  }

  return (
    <li className="rounded-lg border border-(--color-border) bg-(--color-surface)">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={toggleExpanded} className={`flex flex-1 items-center gap-3 rounded-lg text-left text-sm ${focusRing}`}>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-(--color-text-muted)">
            <ChevronDown size={16} />
          </motion.span>

          {editingName ? (
            <span className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={`${plainInputClass} flex-1`}
              />
            </span>
          ) : (
            <span className="flex-1">
              <span className="font-semibold">{fund.fundCode}</span> <span className="text-(--color-text-muted)">—</span> {fund.name}
            </span>
          )}
        </button>

        {editingName ? (
          <>
            <Tooltip label="Kaydet">
              <button onClick={handleSaveName} disabled={savingName} className={iconButtonClass} aria-label="Kaydet">
                <Check size={16} />
              </button>
            </Tooltip>
            <Tooltip label="İptal">
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameInput(fund.name);
                }}
                className={iconButtonClass}
                aria-label="İptal"
              >
                <X size={16} />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <div className="text-right text-sm">
              <div className="font-semibold tabular-nums">{fund.currentValue !== null ? currencyFormatter.format(fund.currentValue) : "—"}</div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-(--color-text-muted) tabular-nums">{numberFormatter.format(fund.netUnits)} birim</span>
                {profitLoss && (
                  <Tooltip
                    label={`Yatırılan tutara göre ${profitLoss.amount >= 0 ? "kâr" : "zarar"}: ${currencyFormatter.format(Math.abs(profitLoss.amount))}`}
                  >
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                        profitLoss.amount >= 0 ? "text-(--color-accent)" : "text-red-400"
                      }`}
                    >
                      {profitLoss.amount >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {profitLoss.percent !== null && `${profitLoss.percent >= 0 ? "+" : ""}${profitLoss.percent.toFixed(1)}%`}
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip label="Fon adını düzenle">
              <button onClick={() => setEditingName(true)} className={iconButtonClass} aria-label="Fon adını düzenle">
                <Pencil size={14} />
              </button>
            </Tooltip>
            <Tooltip label="Fonu sil">
              <button onClick={handleDeleteFund} className={iconButtonClass} aria-label="Fonu sil">
                <Trash2 size={14} />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 border-t border-(--color-border) px-4 py-4 sm:grid-cols-2">
              {loadError && <p className="text-sm text-red-400 sm:col-span-2">{loadError}</p>}

              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                  <Calendar size={13} /> Fiyat Geçmişi
                </h3>

                {prices !== null && prices.length === 0 && <p className="mb-3 text-sm text-(--color-text-muted)">Henüz fiyat kaydı yok.</p>}

                {prices !== null && prices.length > 0 && (
                  <ul className="mb-4 flex flex-col gap-1.5 text-sm">
                    {prices.map((p) => (
                      <li key={p.date} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-(--color-bg)">
                        <span className="text-(--color-text-muted)">{p.date}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium tabular-nums">{numberFormatter.format(p.price)}</span>
                          <Tooltip label="Fiyatı sil">
                            <button onClick={() => handleDeletePrice(p.date)} className={iconButtonClass} aria-label="Fiyatı sil">
                              <Trash2 size={12} />
                            </button>
                          </Tooltip>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddPrice} className="flex flex-wrap items-end gap-2">
                  <input type="date" required value={priceDate} onChange={(e) => setPriceDate(e.target.value)} className={plainInputClass} />
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Fiyat"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className={`${plainInputClass} w-24 ${isValidDecimal(priceValue) ? "" : "border-red-400 focus-visible:outline-red-400"}`}
                  />
                  <Tooltip label="Fiyat ekle">
                    <SubmitButton busy={priceBusy} className="w-auto px-3">
                      <Plus size={14} />
                    </SubmitButton>
                  </Tooltip>
                </form>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                  <Receipt size={13} /> İşlemler
                </h3>

                {transactions !== null && transactions.length === 0 && <p className="mb-3 text-sm text-(--color-text-muted)">Henüz işlem yok.</p>}

                {transactions !== null && transactions.length > 0 && (
                  <ul className="mb-4 flex flex-col gap-1.5 text-sm">
                    {transactions.map((t) => (
                      <li key={t.txnId} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-(--color-bg)">
                        <span className="flex items-center gap-1.5 text-(--color-text-muted)">
                          {t.type === "BUY" ? (
                            <TrendingUp size={13} className="text-(--color-accent)" />
                          ) : (
                            <TrendingDown size={13} className="text-red-400" />
                          )}
                          {t.date}
                        </span>
                        <span className="flex items-center gap-2 tabular-nums">
                          <span className="font-medium">
                            {numberFormatter.format(t.units)} × {numberFormatter.format(t.price)}
                          </span>
                          <Tooltip label="İşlemi sil">
                            <button onClick={() => handleDeleteTransaction(t.txnId)} className={iconButtonClass} aria-label="İşlemi sil">
                              <Trash2 size={12} />
                            </button>
                          </Tooltip>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddTransaction} className="flex flex-wrap items-end gap-2">
                  <input type="date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} className={plainInputClass} />
                  <select value={txnType} onChange={(e) => setTxnType(e.target.value as "BUY" | "SELL")} className={plainInputClass}>
                    <option value="BUY">Alış</option>
                    <option value="SELL">Satış</option>
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Adet"
                    value={txnUnits}
                    onChange={(e) => setTxnUnits(e.target.value)}
                    className={`${plainInputClass} w-20 ${isValidDecimal(txnUnits) ? "" : "border-red-400 focus-visible:outline-red-400"}`}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Fiyat"
                    value={txnPrice}
                    onChange={(e) => setTxnPrice(e.target.value)}
                    className={`${plainInputClass} w-20 ${isValidDecimal(txnPrice) ? "" : "border-red-400 focus-visible:outline-red-400"}`}
                  />
                  <Tooltip label="İşlem ekle">
                    <SubmitButton busy={txnBusy} className="w-auto px-3">
                      <Plus size={14} />
                    </SubmitButton>
                  </Tooltip>
                </form>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
