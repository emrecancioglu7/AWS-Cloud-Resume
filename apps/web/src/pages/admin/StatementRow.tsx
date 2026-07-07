import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CalendarDays, Check, ChevronDown, ExternalLink, Loader2, Pencil, Receipt, Repeat, RotateCcw, Trash2, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../auth/api";
import { focusRing } from "../../styles/focusRing";
import { CategoryPicker } from "./CategoryPicker";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./Toast";
import { Tooltip } from "./Tooltip";
import { categoryColor } from "./categoryColors";
import { currencyFormatter } from "./format";
import { iconButtonClass, plainInputClass } from "./formFields";

export type StatementStatus = "pending" | "processing" | "done" | "needs_review" | "failed";
export type ProcessingStage = "queued" | "reading_pdf" | "extracting" | "validating" | "saving" | "done" | "failed";

export interface Statement {
  statementId: string;
  bank: string;
  status: StatementStatus;
  uploadedAt: string;
  processingStage?: ProcessingStage;
  processedAt?: string;
  transactionCount?: number;
  statementTransactionCount?: number | null;
  missingTransactionCount?: number;
  statementPeriodAmount?: number | null;
  amountMismatch?: boolean;
  totalExtracted?: number;
  statementMonth?: string | null;
  lowConfidenceCount?: number;
  outOfPeriodCount?: number;
  skippedInvalidCount?: number;
  reviewIssueCount?: number;
  inferredMonth?: string | null;
  processorVersion?: string;
  model?: string;
  errorMessage?: string;
}

interface StatementDetail extends Statement {
  downloadUrl?: string;
}

interface Transaction {
  txnId: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  categoryConfidence?: number;
  isRecurring: boolean;
}

const statusLabels: Record<StatementStatus, string> = {
  pending: "Bekliyor",
  processing: "İşleniyor...",
  done: "Tamamlandı",
  needs_review: "Kontrol gerekli",
  failed: "Hata",
};

const statusColors: Record<StatementStatus, string> = {
  pending: "text-(--color-text-muted)",
  processing: "text-(--color-accent)",
  done: "text-(--color-accent)",
  needs_review: "text-amber-300",
  failed: "text-red-400",
};

const processingStageLabels: Record<ProcessingStage, string> = {
  queued: "Sırada",
  reading_pdf: "PDF okunuyor",
  extracting: "İşlemler çıkarılıyor",
  validating: "Kontrol ediliyor",
  saving: "Kaydediliyor",
  done: "Tamamlandı",
  failed: "Hata",
};

const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

function needsCategoryReview(txn: Transaction): boolean {
  return typeof txn.categoryConfidence === "number" && txn.categoryConfidence < REVIEW_CONFIDENCE_THRESHOLD;
}

function formatConfidence(value: number): string {
  return `%${Math.round(value * 100)}`;
}

function statementErrorLabel(message?: string): string {
  if (!message) return "Ekstre işlenemedi. Yeniden yüklemeyi deneyin.";
  if (/AccessDenied|not authorized|dynamodb:GetItem|arn:aws/i.test(message)) {
    return "Ekstre işlenemedi: işlemci yetkisi eksik. Terraform apply sonrası tekrar deneyin.";
  }
  if (/OpenAI API|api key|429|rate limit/i.test(message)) {
    return "Ekstre işlenemedi: AI servisi yanıt vermedi. Biraz sonra tekrar deneyin.";
  }
  if (/S3|NoSuchKey|dosya okunamadı/i.test(message)) {
    return "Ekstre dosyası okunamadı. PDF'i yeniden yükleyin.";
  }
  if (/doğrulanamadı|AI çıktısı|işlem.*geçersiz/i.test(message)) {
    return "Ekstrede doğrulanabilir harcama işlemi bulunamadı.";
  }
  return message.length > 140 ? "Ekstre işlenemedi. Yeniden yüklemeyi deneyin; sorun sürerse logları kontrol edin." : message;
}

function formatStatementMonth(month?: string | null): string | null {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function reviewLabel(statement: Statement): string {
  const lowConfidenceCount = statement.lowConfidenceCount ?? 0;
  const reviewIssueCount = statement.reviewIssueCount ?? lowConfidenceCount;
  const missingTransactionCount = statement.missingTransactionCount ?? 0;
  if (lowConfidenceCount > 0) {
    return `${lowConfidenceCount} işlemde kategori güveni düşük. İşlemleri açıp kontrol edin.`;
  }
  if ((statement.skippedInvalidCount ?? 0) > 0) {
    return `${statement.skippedInvalidCount} okunamayan satır atlandı. İşlemleri açıp toplamı kontrol edin.`;
  }
  if (missingTransactionCount > 0 && statement.statementTransactionCount && typeof statement.transactionCount === "number") {
    return `PDF'te ${statement.statementTransactionCount} dönem içi işlem görünüyor, ${statement.transactionCount} işlem çıkarıldı. Eksik satırları kontrol edin.`;
  }
  if (statement.amountMismatch && statement.statementPeriodAmount) {
    return `PDF'te dönem içi işlem tutarı ${currencyFormatter.format(statement.statementPeriodAmount)} görünüyor, çıkarılan işlemlerin toplamı ${currencyFormatter.format(statement.totalExtracted ?? 0)}. Eksik satırları kontrol edin.`;
  }
  if ((statement.outOfPeriodCount ?? 0) > 0) {
    return `${statement.outOfPeriodCount} işlem ekstre ayı dışında görünüyor. İşlemleri açıp doğrulayın.`;
  }
  if (reviewIssueCount > 0) {
    return `${reviewIssueCount} işlem kontrol gerektiriyor. İşlemleri açıp doğrulayın.`;
  }
  return "Ekstre işlendi, birkaç işlem için kontrol öneriliyor.";
}

function displayStatusLabel(statement: Statement): string {
  if (statement.status === "pending" || statement.status === "processing") {
    return statement.processingStage ? processingStageLabels[statement.processingStage] : statusLabels[statement.status];
  }
  return statusLabels[statement.status];
}

function transactionLoadErrorLabel(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/too many requests|429/i.test(message)) {
    return "Detaylar geçici olarak yüklenemedi: çok fazla istek oluştu. Biraz sonra tekrar açmayı deneyin.";
  }
  if (/failed to fetch|network/i.test(message)) {
    return "Detaylar yüklenemedi. Bağlantıyı kontrol edip tekrar açmayı deneyin.";
  }
  return message || "İşlemler yüklenemedi.";
}

function statementCountLabel(statement: Statement): { label: string; warning: string | null } | null {
  if (typeof statement.transactionCount !== "number") return null;
  const expectedCount =
    typeof statement.statementTransactionCount === "number" && statement.statementTransactionCount > 0 ? statement.statementTransactionCount : null;
  const missingCount = statement.missingTransactionCount ?? (expectedCount ? Math.max(0, expectedCount - statement.transactionCount) : 0);
  if (expectedCount && missingCount > 0) {
    return {
      label: `${statement.transactionCount} / ${expectedCount} işlem`,
      warning: `PDF'te ${expectedCount} dönem içi işlem görünüyor, ${statement.transactionCount} işlem çıkarıldı.`,
    };
  }
  return { label: `${statement.transactionCount} işlem`, warning: null };
}

export function StatementRow({
  statement,
  onChanged,
  onRetry,
  onCategoryChanged,
}: {
  statement: Statement;
  onChanged: () => void;
  onRetry?: (bank: string) => void;
  onCategoryChanged?: (statementIds: string | string[]) => void;
}) {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [editingMonth, setEditingMonth] = useState(false);
  const [monthInput, setMonthInput] = useState("");
  const [savingMonth, setSavingMonth] = useState(false);

  const canExpand = statement.status === "done" || statement.status === "needs_review";
  const total = transactions?.reduce((sum, t) => sum + t.amount, 0) ?? null;
  const displayedTotal = total ?? statement.totalExtracted ?? null;
  const statementMonthLabel = formatStatementMonth(statement.statementMonth ?? statement.inferredMonth);
  const uploadedDateLabel = new Date(statement.uploadedAt).toLocaleDateString("tr-TR");
  const countLabel = statementCountLabel(statement);

  useEffect(() => {
    if (!expanded || !canExpand || transactions !== null) return;
    let cancelled = false;
    setLoadingTransactions(true);
    setLoadError(null);
    apiFetch<{ statement: StatementDetail; transactions: Transaction[] }>(getIdToken, `/statements/${statement.statementId}`)
      .then((data) => {
        if (cancelled) return;
        setTransactions(data.transactions);
        setDownloadUrl(data.statement.downloadUrl ?? null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(transactionLoadErrorLabel(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingTransactions(false);
      });
    return () => {
      cancelled = true;
      setLoadingTransactions(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, canExpand, statement.statementId, transactions]);

  function toggleExpanded() {
    if (!canExpand) return;
    setExpanded((v) => !v);
  }

  async function handleCategoryChange(txn: Transaction, category: string) {
    setTransactions((prev) => prev?.map((t) => (t.merchant === txn.merchant ? { ...t, category, categoryConfidence: 1 } : t)) ?? null);
    try {
      const result = await apiFetch<{ category: string; updatedTransactions?: number; affectedStatementIds?: string[] }>(
        getIdToken,
        `/statements/${statement.statementId}/transactions/${txn.txnId}`,
        {
          method: "PUT",
          body: JSON.stringify({ category }),
        },
      );
      const updatedCount = result.updatedTransactions ?? 1;
      showToast(updatedCount > 1 ? `${updatedCount} işlem güncellendi.` : "Kategori güncellendi.");
      onCategoryChanged?.(result.affectedStatementIds?.length ? result.affectedStatementIds : statement.statementId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Kategori güncellenemedi.", "error");
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Ekstreyi sil",
      description: "Bu ekstreyi ve içindeki tüm işlemleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
    });
    if (!ok) return;
    try {
      await apiFetch(getIdToken, `/statements/${statement.statementId}`, { method: "DELETE" });
      showToast("Ekstre silindi.");
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Silinemedi.", "error");
    }
  }

  async function handleOpenPdf() {
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setOpeningPdf(true);
    try {
      const data = await apiFetch<{ statement: StatementDetail; transactions: Transaction[] }>(getIdToken, `/statements/${statement.statementId}`);
      const freshUrl = data.statement.downloadUrl ?? null;
      setDownloadUrl(freshUrl);
      if (!freshUrl) {
        popup?.close();
        showToast("PDF bağlantısı alınamadı.", "error");
        return;
      }
      if (popup) {
        popup.location.href = freshUrl;
      } else {
        window.open(freshUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      popup?.close();
      showToast(err instanceof Error ? err.message : "PDF bağlantısı yenilenemedi.", "error");
    } finally {
      setOpeningPdf(false);
    }
  }

  function startEditMonth() {
    setMonthInput(statement.statementMonth ?? statement.inferredMonth ?? "");
    setEditingMonth(true);
  }

  async function handleSaveMonth() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)) {
      showToast("Geçersiz dönem.", "error");
      return;
    }
    setSavingMonth(true);
    try {
      await apiFetch(getIdToken, `/statements/${statement.statementId}`, { method: "PUT", body: JSON.stringify({ statementMonth: monthInput }) });
      showToast("Ekstre dönemi güncellendi.");
      setEditingMonth(false);
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ekstre dönemi güncellenemedi.", "error");
    } finally {
      setSavingMonth(false);
    }
  }

  return (
    <li className="rounded-lg border border-(--color-border) bg-(--color-surface)">
      <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-3">
        <button
          onClick={toggleExpanded}
          disabled={!canExpand}
          aria-label={canExpand ? `${statement.bank} ekstresini aç` : `${statement.bank} ekstresi`}
          className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg text-left sm:flex-nowrap ${focusRing} ${canExpand ? "" : "cursor-default"}`}
        >
          {canExpand ? (
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-(--color-text-muted)">
              <ChevronDown size={14} />
            </motion.span>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <Receipt size={14} className="shrink-0 text-(--color-text-muted)" />
          <span className="min-w-0 truncate font-medium">{statement.bank}</span>
          {statementMonthLabel && (
            <>
              <span className="hidden h-4 w-px shrink-0 bg-(--color-border) sm:inline-block" aria-hidden="true" />
              <span className="shrink-0 text-(--color-text-muted)">Ekstre {statementMonthLabel}</span>
            </>
          )}
          {countLabel && (
            <>
              <span className="hidden h-4 w-px shrink-0 bg-(--color-border) sm:inline-block" aria-hidden="true" />
              {countLabel.warning ? (
                <Tooltip label={countLabel.warning}>
                  <span className="shrink-0 tabular-nums text-amber-300">{countLabel.label}</span>
                </Tooltip>
              ) : (
                <span className="shrink-0 text-(--color-text-muted)">{countLabel.label}</span>
              )}
            </>
          )}
          {displayedTotal !== null && (
            <>
              <span className="hidden h-4 w-px shrink-0 bg-(--color-border) sm:inline-block" aria-hidden="true" />
              {statement.amountMismatch && statement.statementPeriodAmount ? (
                <Tooltip label={`PDF'te dönem içi işlem tutarı ${currencyFormatter.format(statement.statementPeriodAmount)} görünüyor.`}>
                  <span className="shrink-0 font-medium tabular-nums text-amber-300">{currencyFormatter.format(displayedTotal)}</span>
                </Tooltip>
              ) : (
                <span className="shrink-0 font-medium tabular-nums">{currencyFormatter.format(displayedTotal)}</span>
              )}
            </>
          )}
        </button>
        <span className="flex items-center gap-3 sm:justify-end">
          {statement.status === "failed" && statement.errorMessage ? (
            <Tooltip label={statementErrorLabel(statement.errorMessage)}>
              <span className={`flex items-center gap-1 ${statusColors[statement.status]}`}>
                <AlertCircle size={13} /> {statusLabels[statement.status]}
              </span>
            </Tooltip>
          ) : statement.status === "processing" || statement.status === "pending" ? (
            <span className={`flex items-center gap-1.5 ${statusColors[statement.status]}`}>
              <Loader2 size={13} className="animate-spin" /> {displayStatusLabel(statement)}
            </span>
          ) : statement.status === "needs_review" ? (
            <Tooltip label={reviewLabel(statement)}>
              <span className={`flex items-center gap-1 ${statusColors[statement.status]}`}>
                <AlertCircle size={13} /> {statusLabels[statement.status]}
              </span>
            </Tooltip>
          ) : (
            <span className={statusColors[statement.status]}>{statusLabels[statement.status]}</span>
          )}
          {statement.status === "failed" && onRetry && (
            <Tooltip label="Aynı bankayla yeniden yükle">
              <button onClick={() => onRetry(statement.bank)} className={iconButtonClass} aria-label="Yeniden yükle">
                <RotateCcw size={14} />
              </button>
            </Tooltip>
          )}
        </span>
        <Tooltip label="Yüklenme tarihi">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-(--color-text-muted) sm:justify-end sm:text-right">
            <CalendarDays size={13} aria-hidden="true" />
            {uploadedDateLabel}
          </span>
        </Tooltip>
        <Tooltip label="Ekstreyi sil">
          <button onClick={handleDelete} className={`${iconButtonClass} sm:justify-self-end`} aria-label="Ekstreyi sil">
            <Trash2 size={14} />
          </button>
        </Tooltip>
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
            <div className="border-t border-(--color-border) px-4 py-3">
              <div className="mb-3 flex items-center gap-2 text-xs text-(--color-text-muted)">
                <CalendarDays size={12} className="shrink-0" aria-hidden="true" />
                {editingMonth ? (
                  <>
                    <input
                      type="month"
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                      aria-label="Ekstre dönemi"
                      className={`${plainInputClass} w-36`}
                    />
                    <Tooltip label="Kaydet">
                      <button
                        onClick={handleSaveMonth}
                        disabled={savingMonth}
                        className={iconButtonClass}
                        aria-label="Ekstre dönemini kaydet"
                      >
                        <Check size={13} />
                      </button>
                    </Tooltip>
                    <button onClick={() => setEditingMonth(false)} className={iconButtonClass} aria-label="Vazgeç">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span>Ekstre dönemi: {statementMonthLabel ?? "Belirlenmedi"}</span>
                    <Tooltip label="AI dönemi yanlış belirlediyse elle düzeltin">
                      <button onClick={startEditMonth} className={iconButtonClass} aria-label="Ekstre dönemini düzelt">
                        <Pencil size={12} />
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>
              {loadingTransactions && <p className="text-sm text-(--color-text-muted)">İşlemler yükleniyor...</p>}
              {loadError && <p className="text-sm text-red-400">{loadError}</p>}
              {downloadUrl && (
                <button
                  type="button"
                  onClick={handleOpenPdf}
                  disabled={openingPdf}
                  className={`mb-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-(--color-accent) hover:underline ${focusRing}`}
                >
                  <ExternalLink size={12} /> {openingPdf ? "PDF bağlantısı yenileniyor..." : "Orijinal PDF'i görüntüle"}
                </button>
              )}
              {transactions !== null && transactions.length === 0 && <p className="text-sm text-(--color-text-muted)">İşlem bulunamadı.</p>}
              {transactions !== null && transactions.length > 0 && (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {transactions.map((t, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-(--color-bg)">
                      <span className="flex items-center gap-2 text-(--color-text-muted)">
                        <span className="text-xs">{t.date}</span>
                        {t.merchant}
                        {t.isRecurring && (
                          <Tooltip label="Düzenli ödeme">
                            <Repeat size={11} aria-label="Düzenli ödeme" className="text-(--color-text-muted)" />
                          </Tooltip>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <CategoryPicker
                          value={t.category}
                          color={categoryColor(t.category)}
                          onChange={(next) => handleCategoryChange(t, next)}
                        />
                        {needsCategoryReview(t) && (
                          <Tooltip label={`AI kategori güveni düşük: ${formatConfidence(t.categoryConfidence ?? 0)}`}>
                            <AlertCircle size={12} aria-label="Kategori kontrol edilmeli" className="text-amber-300" />
                          </Tooltip>
                        )}
                        <span className="tabular-nums font-medium">{currencyFormatter.format(t.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
