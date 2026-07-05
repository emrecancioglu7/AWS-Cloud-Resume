import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, ChevronDown, Pencil, Plus, Receipt, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { useToast } from "./Toast";
import { currencyFormatter, numberFormatter } from "./format";
import { SubmitButton, iconButtonClass, plainInputClass } from "./formFields";

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

export function FundRow({ fund, onChanged }: { fund: FundSummary; onChanged: () => void }) {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);

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
    if (!window.confirm(`${fund.fundCode} fonunu ve tüm fiyat/işlem geçmişini silmek istediğinize emin misiniz?`)) return;
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

  async function handleDeletePrice(date: string) {
    if (!window.confirm(`${date} tarihli fiyat kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}/prices/${date}`, { method: "DELETE" });
      showToast("Fiyat silindi.");
      await loadDetails();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
    }
  }

  async function handleAddTransaction(e: FormEvent) {
    e.preventDefault();
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

  async function handleDeleteTransaction(txnId: string) {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch(getIdToken, `/funds/${fund.fundCode}/transactions/${txnId}`, { method: "DELETE" });
      showToast("İşlem silindi.");
      await loadDetails();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
    }
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
              <span className="font-semibold">{fund.fundCode}</span> — {fund.name}
            </span>
          )}
        </button>

        {editingName ? (
          <>
            <button onClick={handleSaveName} disabled={savingName} className={iconButtonClass} aria-label="Kaydet">
              <Check size={16} />
            </button>
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
          </>
        ) : (
          <>
            <div className="text-right text-sm">
              <div className="font-semibold tabular-nums">{fund.currentValue !== null ? currencyFormatter.format(fund.currentValue) : "—"}</div>
              <div className="text-xs text-(--color-text-muted) tabular-nums">{numberFormatter.format(fund.netUnits)} birim</div>
            </div>
            <button onClick={() => setEditingName(true)} className={iconButtonClass} aria-label="Fon adını düzenle">
              <Pencil size={14} />
            </button>
            <button onClick={handleDeleteFund} className={iconButtonClass} aria-label="Fonu sil">
              <Trash2 size={14} />
            </button>
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
                  <ul className="mb-4 flex flex-col gap-1 text-sm">
                    {prices.map((p) => (
                      <li key={p.date} className="flex items-center justify-between gap-2 tabular-nums text-(--color-text-muted)">
                        <span>{p.date}</span>
                        <span className="flex items-center gap-1">
                          {numberFormatter.format(p.price)}
                          <button onClick={() => handleDeletePrice(p.date)} className={iconButtonClass} aria-label="Fiyatı sil">
                            <Trash2 size={12} />
                          </button>
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
                    className={`${plainInputClass} w-24`}
                  />
                  <SubmitButton busy={priceBusy} className="w-auto px-3">
                    <Plus size={14} />
                  </SubmitButton>
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
                      <li key={t.txnId} className="flex items-center justify-between gap-2 text-(--color-text-muted)">
                        <span className="flex items-center gap-1.5">
                          {t.type === "BUY" ? (
                            <TrendingUp size={13} className="text-(--color-accent)" />
                          ) : (
                            <TrendingDown size={13} className="text-red-400" />
                          )}
                          {t.date}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums">
                          {numberFormatter.format(t.units)} × {numberFormatter.format(t.price)}
                          <button onClick={() => handleDeleteTransaction(t.txnId)} className={iconButtonClass} aria-label="İşlemi sil">
                            <Trash2 size={12} />
                          </button>
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
                    className={`${plainInputClass} w-20`}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Fiyat"
                    value={txnPrice}
                    onChange={(e) => setTxnPrice(e.target.value)}
                    className={`${plainInputClass} w-20`}
                  />
                  <SubmitButton busy={txnBusy} className="w-auto px-3">
                    <Plus size={14} />
                  </SubmitButton>
                </form>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
