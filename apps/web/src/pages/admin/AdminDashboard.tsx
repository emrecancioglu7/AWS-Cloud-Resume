import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Hash, LogOut, Plus, Tag, Wallet } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { FundRow } from "./FundRow";
import { useToast } from "./Toast";
import { currencyFormatter } from "./format";
import { IconField, SubmitButton } from "./formFields";

interface FundSummary {
  fundCode: string;
  name: string;
  netUnits: number;
  latestPrice: number | null;
  latestPriceDate: string | null;
  currentValue: number | null;
}

export function AdminDashboard() {
  const { email, getIdToken, signOut } = useAuth();
  const { showToast } = useToast();
  const [funds, setFunds] = useState<FundSummary[] | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [fundCode, setFundCode] = useState("");
  const [fundName, setFundName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadSummary() {
    setError(null);
    try {
      const data = await apiFetch<{ funds: FundSummary[]; totalValue: number }>(getIdToken, "/portfolio/summary");
      setFunds(data.funds);
      setTotalValue(data.totalValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portföy yüklenemedi.");
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddFund(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setBusy(true);
    try {
      await apiFetch(getIdToken, "/funds", { method: "POST", body: JSON.stringify({ fundCode, name: fundName }) });
      setFundCode("");
      setFundName("");
      showToast("Fon eklendi.");
      await loadSummary();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Fon eklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--color-bg) px-6 py-10 text-(--color-text)">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-bold text-(--color-accent)">
              EÇ
            </span>
            <div>
              <h1 className="font-heading text-xl font-semibold">Portföy</h1>
              <p className="text-sm text-(--color-text-muted)">{email}</p>
            </div>
          </div>
          <button onClick={signOut} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text) ${focusRing}`}>
            <LogOut size={15} /> Çıkış yap
          </button>
        </div>

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

        <form onSubmit={handleAddFund} className="mb-8 flex flex-wrap items-end gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-(--color-text-muted)">Fon Kodu</label>
            <IconField
              icon={<Hash size={14} />}
              type="text"
              required
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
            <Plus size={15} /> Fon ekle
          </SubmitButton>
        </form>
        {addError && <p className="mb-4 text-sm text-red-400">{addError}</p>}

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {!error && funds === null && <p className="text-sm text-(--color-text-muted)">Yükleniyor...</p>}

        {funds !== null && funds.length === 0 && (
          <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-10 text-center text-sm text-(--color-text-muted)">
            Henüz fon eklenmedi — yukarıdaki formla ilk fonunuzu ekleyin.
          </p>
        )}

        {funds !== null && funds.length > 0 && (
          <ul className="flex flex-col gap-2">
            {funds.map((fund) => (
              <FundRow key={fund.fundCode} fund={fund} onChanged={loadSummary} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
