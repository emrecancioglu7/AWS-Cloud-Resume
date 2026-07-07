import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileUp, Plus, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { AdminLayout } from "./AdminLayout";
import { AllTransactionsView } from "./AllTransactionsView";
import { useConfirm } from "./ConfirmDialog";
import { Skeleton, SkeletonRows } from "./Skeleton";
import { SpendingBreakdown } from "./SpendingBreakdown";
import { StatementRow, type Statement } from "./StatementRow";
import { useToast } from "./Toast";
import type { TrendPoint } from "./TrendChart";
import { SubmitButton, plainInputClass } from "./formFields";

const BANKS = ["İş Bankası", "Garanti BBVA", "Akbank", "Yapı Kredi", "Ziraat Bankası", "Vakıfbank", "QNB", "Diğer"];

// Aynı bankadan bu kadar gün içinde ikinci bir ekstre yüklenirse "muhtemelen tekrar" uyarısı gösterilir.
const DUPLICATE_WARNING_WINDOW_DAYS = 20;

interface RecurringTxn {
  merchant: string;
  amount: number;
  date: string;
}

interface TopMerchant {
  merchant: string;
  amount: number;
  count: number;
}

interface MaxTransaction {
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

interface SpendingSummary {
  month: string | null;
  total: number;
  byCategory: Record<string, number>;
  byBank: Record<string, number>;
  topMerchants: TopMerchant[];
  recurring: RecurringTxn[];
  maxTransaction: MaxTransaction | null;
  transactionCount: number;
}

export interface CachedTransaction {
  txnId: string;
  statementId: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  categoryConfidence?: number;
  isRecurring: boolean;
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function uploadFileWithProgress(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "application/pdf");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Dosya S3'e yüklenemedi."));
    };
    xhr.onerror = () => reject(new Error("Dosya S3'e yüklenemedi."));
    xhr.send(file);
  });
}

export function Statements() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [statements, setStatements] = useState<Statement[] | null>(null);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [yearTotal, setYearTotal] = useState<number | null>(null);
  const [yearOverYearTotal, setYearOverYearTotal] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [bankLimits, setBankLimits] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  // null = henüz çözümlenmedi (ilk yüklemede backend en son verinin olduğu ayı otomatik bulur).
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [bankFilter, setBankFilter] = useState<string | null>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [view, setView] = useState<"statements" | "all">("statements");
  const [drilldownCategory, setDrilldownCategory] = useState<string | undefined>(undefined);
  const [drilldownToken, setDrilldownToken] = useState(0);
  const [bank, setBank] = useState(BANKS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // "Tüm İşlemler" ve "Takvim" sekmeleri arasında geçiş yaparken her seferinde tüm ekstrelerin
  // işlemlerini yeniden çekmemek için ekstre ID'sine göre paylaşılan bir önbellek.
  const [txnCache, setTxnCache] = useState<Record<string, CachedTransaction[]>>({});
  const txnCacheRef = useRef(txnCache);
  useEffect(() => {
    txnCacheRef.current = txnCache;
  }, [txnCache]);

  async function loadTransactionsForStatements(statementIds: string[]): Promise<Record<string, CachedTransaction[]>> {
    const missing = statementIds.filter((id) => !(id in txnCacheRef.current));
    if (missing.length === 0) return txnCacheRef.current;
    const fetched = await Promise.all(
      missing.map((id) =>
        apiFetch<{ transactions: CachedTransaction[] }>(getIdToken, `/statements/${id}`).then((data) => [id, data.transactions] as const),
      ),
    );
    const merged = { ...txnCacheRef.current, ...Object.fromEntries(fetched) };
    txnCacheRef.current = merged;
    setTxnCache(merged);
    return merged;
  }

  function invalidateTransactionCache(statementId: string) {
    setTxnCache((prev) => {
      if (!(statementId in prev)) return prev;
      const next = { ...prev };
      delete next[statementId];
      txnCacheRef.current = next;
      return next;
    });
  }

  async function loadStatements() {
    try {
      const data = await apiFetch<{ statements: Statement[] }>(getIdToken, "/statements");
      setStatements(data.statements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ekstreler yüklenemedi.");
    }
  }

  async function loadSummary(month: string | null) {
    try {
      const query = month ? `?month=${month}` : "";
      const data = await apiFetch<SpendingSummary>(getIdToken, `/spending/summary${query}`);
      setSummary(data);
      // İlk yükleme (month === null) backend'in bulduğu en son ayı seçili aya çeviriyor;
      // kullanıcının o andan sonra gezindiği ay bunun üzerine yazılmıyor.
      if (month === null && data.month) {
        setMonthFilter(data.month);
        loadTrend(data.month);
        loadYearTotal(data.month);
        loadYearOverYear(data.month);
      } else if (month === null) {
        setMonthFilter(null);
      }
    } catch {
      // Özet isteğe bağlı — başarısız olursa ekstre listesi yine de kullanılabilir kalsın.
    }
  }

  // Son 6 ayın toplamını + kategori kırılımını (seçili aya sabit, ay gezinmesiyle yeniden
  // çekilmez) getirip trend şeridi, önceki aya göre değişim, en çok değişen kategori ve
  // kategori bazlı mini trend için kullanılır.
  async function loadTrend(anchorMonth: string) {
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(anchorMonth, i - 5));
    try {
      const results = await Promise.all(
        months.map((m) =>
          apiFetch<SpendingSummary>(getIdToken, `/spending/summary?month=${m}`).then((data) => ({
            month: m,
            total: data.total,
            byCategory: data.byCategory,
            transactionCount: data.transactionCount,
          })),
        ),
      );
      setTrend(results);
    } catch {
      // Trend isteğe bağlı bir görsel — başarısız olursa breakdown kartı yine de çalışır.
    }
  }

  // Ocak'tan seçili aya kadar olan toplamları toplayıp "bu yıl toplam harcama" rakamını verir.
  async function loadYearTotal(anchorMonth: string) {
    const year = Number(anchorMonth.slice(0, 4));
    const monthIndex = Number(anchorMonth.slice(5, 7));
    const months = Array.from({ length: monthIndex }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    try {
      const totals = await Promise.all(
        months.map((m) => apiFetch<SpendingSummary>(getIdToken, `/spending/summary?month=${m}`).then((data) => data.total)),
      );
      setYearTotal(totals.reduce((sum, t) => sum + t, 0));
    } catch {
      // Yıllık toplam isteğe bağlı bir görsel — başarısız olursa breakdown kartı yine de çalışır.
    }
  }

  // Geçen yılın aynı ayının toplamını getirip "geçen yıl bu ay" karşılaştırmasında kullanılır.
  async function loadYearOverYear(anchorMonth: string) {
    const year = Number(anchorMonth.slice(0, 4));
    const monthPart = anchorMonth.slice(5, 7);
    try {
      const data = await apiFetch<SpendingSummary>(getIdToken, `/spending/summary?month=${year - 1}-${monthPart}`);
      setYearOverYearTotal(data.total);
    } catch {
      // Yıl karşılaştırması isteğe bağlı bir görsel — başarısız olursa breakdown kartı yine de çalışır.
    }
  }

  async function loadBudgets() {
    try {
      const data = await apiFetch<{ budgets: Record<string, number> }>(getIdToken, "/budgets");
      setBudgets(data.budgets);
    } catch {
      // Bütçeler isteğe bağlı — başarısız olursa kategori kırılımı bütçesiz gösterilir.
    }
  }

  async function loadBankLimits() {
    try {
      const data = await apiFetch<{ limits: Record<string, number> }>(getIdToken, "/bank-limits");
      setBankLimits(data.limits);
    } catch {
      // Kart limitleri isteğe bağlı — başarısız olursa banka kırılımı limitsiz gösterilir.
    }
  }

  async function handleSetBankLimit(bankName: string, limit: number) {
    try {
      await apiFetch(getIdToken, "/bank-limits", { method: "PUT", body: JSON.stringify({ bank: bankName, limit }) });
      setBankLimits((prev) => {
        const next = { ...prev };
        if (limit > 0) next[bankName] = limit;
        else delete next[bankName];
        return next;
      });
      showToast(limit > 0 ? "Kart limiti kaydedildi." : "Kart limiti kaldırıldı.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Kart limiti kaydedilemedi.", "error");
    }
  }

  async function handleSetBudget(category: string, limit: number) {
    try {
      await apiFetch(getIdToken, "/budgets", { method: "PUT", body: JSON.stringify({ category, limit }) });
      setBudgets((prev) => {
        const next = { ...prev };
        if (limit > 0) next[category] = limit;
        else delete next[category];
        return next;
      });
      showToast(limit > 0 ? "Bütçe kaydedildi." : "Bütçe kaldırıldı.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bütçe kaydedilemedi.", "error");
    }
  }

  useEffect(() => {
    loadStatements();
    loadSummary(null); // bootstrap: backend resolves + returns the latest month that has data
    loadBudgets();
    loadBankLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToMonth(delta: number) {
    const next = shiftMonth(monthFilter ?? currentMonthStr(), delta);
    setMonthFilter(next);
    loadSummary(next);
  }

  const pendingCount = statements?.filter((s) => s.status === "pending" || s.status === "processing").length ?? 0;

  // Bir ekstre "bekliyor/işleniyor" durumundan çıktığında (sekme arka planda olsa da) tarayıcı
  // bildirimi gösterir — kullanıcı yükleme sırasında izin vermişse.
  const previouslyPendingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!statements) return;
    const currentlyPending = new Set(statements.filter((s) => s.status === "pending" || s.status === "processing").map((s) => s.statementId));
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const s of statements) {
        if (previouslyPendingRef.current.has(s.statementId) && !currentlyPending.has(s.statementId)) {
          const title = s.status === "done" ? "Ekstre işlendi" : s.status === "needs_review" ? "Ekstre kontrol bekliyor" : "Ekstre işlenemedi";
          const body =
            s.status === "done"
              ? `${s.bank} ekstresi başarıyla işlendi.`
              : s.status === "needs_review"
                ? `${s.bank} ekstresi işlendi, birkaç işlem kontrol istiyor.`
                : `${s.bank} ekstresi işlenirken bir hata oluştu.`;
          new Notification(title, {
            body,
          });
        }
      }
    }
    previouslyPendingRef.current = currentlyPending;
  }, [statements]);

  // Polling her tetiklendiğinde en son render'daki ayı görsün — [statements]'a bağlı efekt
  // yalnızca statements değiştiğinde yeniden kurulur, monthFilter değiştiğinde değil, bu yüzden
  // düz bir closure burada "null" ayda donup kalabilir ve her pollingde ay yeniden çözümlenip
  // (henüz işlenmekte olan ekstrenin ayına atlayıp) özet kartının anlık olarak kaybolmasına yol açar.
  const monthFilterRef = useRef(monthFilter);
  useEffect(() => {
    monthFilterRef.current = monthFilter;
  }, [monthFilter]);

  // Bekleyen/işlenen bir ekstre varken birkaç saniyede bir yenile, durum "done"/"failed" olunca dur.
  useEffect(() => {
    if (!pendingCount) return;
    const interval = setInterval(() => {
      loadStatements();
      loadSummary(monthFilterRef.current);
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statements]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "Escape" && showUploadForm) {
        setShowUploadForm(false);
      } else if (!isTyping && (e.key === "n" || e.key === "N") && !showUploadForm) {
        e.preventDefault();
        setShowUploadForm(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showUploadForm]);

  function handleFileDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      showToast("Önce bir PDF dosyası seçin.", "error");
      return;
    }

    const recentDuplicate = (statements ?? []).find((s) => {
      if (s.bank !== bank) return false;
      const daysSince = (Date.now() - new Date(s.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= DUPLICATE_WARNING_WINDOW_DAYS;
    });
    if (recentDuplicate) {
      const ok = await confirm({
        title: "Bu ekstreyi zaten yüklemiş olabilirsiniz",
        description: `${bank} bankasından ${new Date(recentDuplicate.uploadedAt).toLocaleDateString("tr-TR")} tarihinde bir ekstre daha var. Yine de devam edilsin mi?`,
        confirmLabel: "Yine de yükle",
      });
      if (!ok) return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const { uploadUrl } = await apiFetch<{ statementId: string; uploadUrl: string }>(getIdToken, "/statements", {
        method: "POST",
        body: JSON.stringify({ bank }),
      });
      await uploadFileWithProgress(uploadUrl, file, setUploadProgress);

      setFile(null);
      setShowUploadForm(false);
      showToast("Ekstre yüklendi, işleniyor...");
      await loadStatements();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Yükleme başarısız oldu.", "error");
    } finally {
      setUploading(false);
    }
  }

  function handleRetry(retryBank: string) {
    setBank(retryBank);
    setShowUploadForm(true);
  }

  function handleCategoryClick(category: string) {
    setDrilldownCategory(category);
    setDrilldownToken((t) => t + 1);
    setView("all");
  }

  function handleCategoryChanged(statementIds: string | string[]) {
    for (const statementId of Array.isArray(statementIds) ? statementIds : [statementIds]) {
      invalidateTransactionCache(statementId);
    }
    loadSummary(monthFilter);
  }

  function handleStatementChanged(statementId: string) {
    invalidateTransactionCache(statementId);
    loadStatements();
    loadSummary(monthFilter);
  }

  const banks = useMemo(() => Array.from(new Set((statements ?? []).map((s) => s.bank))).sort(), [statements]);
  const visibleStatements = useMemo(
    () => (bankFilter ? (statements ?? []).filter((s) => s.bank === bankFilter) : statements ?? []),
    [statements, bankFilter],
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-center gap-1 text-sm">
        <button
          onClick={() => goToMonth(-1)}
          aria-label="Önceki ay"
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text) ${focusRing}`}
        >
          <ChevronLeft size={15} />
        </button>
        <span className="min-w-32 text-center font-medium">{monthFilter ? formatMonthLabel(monthFilter) : "—"}</span>
        <button
          onClick={() => goToMonth(1)}
          aria-label="Sonraki ay"
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text) ${focusRing}`}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {summary === null && <Skeleton className="mb-8 h-56 w-full rounded-xl" />}

      {summary !== null && summary.transactionCount === 0 && (
        <p className="mb-8 rounded-xl border border-dashed border-(--color-border) px-6 py-8 text-center text-sm text-(--color-text-muted)">
          {monthFilter ? `${formatMonthLabel(monthFilter)} için harcama kaydı yok.` : "Henüz harcama kaydı yok."}
        </p>
      )}

      {summary && summary.transactionCount > 0 && (
        <SpendingBreakdown
          total={summary.total}
          transactionCount={summary.transactionCount}
          byCategory={summary.byCategory}
          byBank={summary.byBank ?? {}}
          topMerchants={summary.topMerchants ?? []}
          recurring={summary.recurring}
          maxTransaction={summary.maxTransaction ?? null}
          pendingCount={pendingCount}
          onCategoryClick={handleCategoryClick}
          trend={trend}
          activeMonth={monthFilter}
          yearTotal={yearTotal}
          yearOverYearTotal={yearOverYearTotal}
          budgets={budgets}
          onSetBudget={handleSetBudget}
          bankLimits={bankLimits}
          onSetBankLimit={handleSetBankLimit}
          statements={statements ?? []}
          loadTransactions={loadTransactionsForStatements}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-(--color-surface) p-1 text-sm">
          <button
            onClick={() => setView("statements")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${focusRing} ${
              view === "statements" ? "bg-(--color-accent-soft) text-(--color-accent)" : "text-(--color-text-muted) hover:text-(--color-text)"
            }`}
          >
            Ekstreler
          </button>
          <button
            onClick={() => setView("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${focusRing} ${
              view === "all" ? "bg-(--color-accent-soft) text-(--color-accent)" : "text-(--color-text-muted) hover:text-(--color-text)"
            }`}
          >
            Tüm İşlemler
          </button>
        </div>
        <button
          onClick={() => setShowUploadForm((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg bg-(--color-accent-soft) px-3 py-2 text-sm font-medium text-(--color-accent) transition-opacity hover:opacity-80 ${focusRing}`}
        >
          {showUploadForm ? <X size={14} /> : <Plus size={14} />}
          {showUploadForm ? "Vazgeç" : "Yeni Ekstre"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showUploadForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleUpload}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-(--color-text-muted)">Banka</label>
                <select value={bank} onChange={(e) => setBank(e.target.value)} className={plainInputClass}>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-(--color-text-muted)">Ekstre (PDF)</label>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm transition-colors ${
                    isDragging ? "border-(--color-accent) bg-(--color-accent-soft)" : "border-(--color-border) bg-(--color-bg)"
                  }`}
                >
                  <FileUp size={14} className="shrink-0 text-(--color-text-muted)" />
                  <span className="truncate text-(--color-text-muted)">{file ? file.name : "PDF seçin veya sürükleyip bırakın"}</span>
                  <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
              </div>
              <SubmitButton busy={uploading} className="w-auto px-4">
                <FileUp size={15} /> Yükle
              </SubmitButton>
            </div>
            {uploading && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--color-bg)">
                <motion.div
                  className="h-full rounded-full bg-(--color-accent)"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {!error && statements === null && <SkeletonRows count={3} />}

      {statements !== null && statements.length === 0 && (
        <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-10 text-center text-sm text-(--color-text-muted)">
          Henüz ekstre yüklenmedi — "Yeni Ekstre" ile ilk ekstrenizi yükleyin.
        </p>
      )}

      {statements !== null && statements.length > 0 && view === "all" && (
        <AllTransactionsView
          key={drilldownToken}
          statements={statements}
          monthFilter={monthFilter}
          initialCategory={drilldownCategory}
          onCategoryChanged={handleCategoryChanged}
          loadTransactions={loadTransactionsForStatements}
        />
      )}

      {statements !== null && statements.length > 0 && view === "statements" && (
        <>
          {banks.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setBankFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${
                  bankFilter === null ? "bg-(--color-accent-soft) text-(--color-accent)" : "bg-(--color-surface) text-(--color-text-muted)"
                }`}
              >
                Tüm Bankalar
              </button>
              {banks.map((b) => (
                <button
                  key={b}
                  onClick={() => setBankFilter(b)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${
                    bankFilter === b ? "bg-(--color-accent-soft) text-(--color-accent)" : "bg-(--color-surface) text-(--color-text-muted)"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {visibleStatements.map((s) => (
              <StatementRow
                key={s.statementId}
                statement={s}
                onChanged={() => handleStatementChanged(s.statementId)}
                onRetry={handleRetry}
                onCategoryChanged={handleCategoryChanged}
              />
            ))}
          </ul>
        </>
      )}
    </AdminLayout>
  );
}
