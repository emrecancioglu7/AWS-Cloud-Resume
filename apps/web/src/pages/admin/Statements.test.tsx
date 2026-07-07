import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Statements } from "./Statements";

const { mockApiFetch, mockShowToast, mockConfirm } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
  mockConfirm: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ email: "admin@example.com", getIdToken: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("../../theme/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));
vi.mock("./ConfirmDialog", () => ({ useConfirm: () => mockConfirm }));

class MockXMLHttpRequest {
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 200;
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn(() => {
    this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 1 });
    this.onload?.();
  });
}

function renderStatements() {
  return render(
    <MemoryRouter>
      <Statements />
    </MemoryRouter>,
  );
}

const emptySummary = { month: null, total: 0, byCategory: {}, byBank: {}, topMerchants: [], recurring: [], transactionCount: 0 };

beforeEach(() => {
  mockApiFetch.mockReset();
  // Harmless fallback for calls a test doesn't explicitly queue a response for — most notably
  // the background 6-month trend fetch, whose exact timing relative to other calls isn't
  // something individual tests should have to account for call-by-call.
  mockApiFetch.mockResolvedValue({
    statements: [],
    statement: {},
    transactions: [],
    total: 0,
    byCategory: {},
    byBank: {},
    topMerchants: [],
    recurring: [],
    transactionCount: 0,
  });
  mockShowToast.mockReset();
  mockConfirm.mockReset().mockResolvedValue(true);
});

describe("Statements", () => {
  it("shows an empty state when there are no statements", async () => {
    mockApiFetch.mockResolvedValueOnce({ statements: [] }).mockResolvedValueOnce(emptySummary);
    renderStatements();

    expect(await screen.findByText(/Henüz ekstre yüklenmedi/)).toBeInTheDocument();
  });

  it("renders the spending summary with category breakdown, and reveals recurring/bank/merchant details on demand", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [] })
      .mockResolvedValueOnce({
        month: "2026-01",
        total: 150,
        byCategory: { Market: 100, "Faturalar/Abonelikler": 50 },
        byBank: { Akbank: 150 },
        topMerchants: [{ merchant: "Netflix", amount: 50, count: 1 }],
        recurring: [{ merchant: "Netflix", amount: 50, date: "2026-01-05" }],
        transactionCount: 2,
      });
    renderStatements();

    expect(await screen.findByText("Market")).toBeInTheDocument();
    // The bootstrap fetch (no ?month= param) resolves the latest month with data and adopts it as the selected month.
    expect(screen.getByText("Ocak 2026")).toBeInTheDocument();

    // Recurring payments are collapsed by default — reveal them.
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
    await user.click(screen.getByText(/düzenli ödemeler/));
    expect(await screen.findByText("Netflix")).toBeInTheDocument();

    // Bank/merchant breakdowns live behind tabs, not separate always-visible cards.
    await user.click(screen.getByRole("button", { name: "Banka" }));
    expect(await screen.findByText("Akbank")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İşyerleri" }));
    expect(await screen.findByText("1 işlem")).toBeInTheDocument();
  });

  it("degrades gracefully instead of crashing when the backend hasn't been redeployed yet (pre-byBank/topMerchants shape)", async () => {
    mockApiFetch.mockResolvedValueOnce({ statements: [] }).mockResolvedValueOnce({
      // Shape returned by the not-yet-deployed /spending/summary — no month/byBank/topMerchants.
      total: 150,
      byCategory: { Market: 150 },
      recurring: [],
      transactionCount: 1,
    });
    renderStatements();

    expect(await screen.findByText("Market")).toBeInTheDocument();
    expect(screen.queryByText("Banka Bazlı Harcama")).not.toBeInTheDocument();
    expect(screen.queryByText("En Çok Harcanan Yerler")).not.toBeInTheDocument();
  });

  it("lists statements with their status", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] }); // StatementRow's eager per-statement fetch
    renderStatements();

    expect(await screen.findByText("Akbank")).toBeInTheDocument();
    expect(screen.getByText("Tamamlandı")).toBeInTheDocument();
  });

  it("uploads a statement: creates it, PUTs the file to the presigned URL, and reloads the list", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ statements: [] }).mockResolvedValueOnce(emptySummary);
    renderStatements();
    await screen.findByText(/Henüz ekstre yüklenmedi/);

    mockApiFetch.mockResolvedValueOnce({ statementId: "s1", uploadUrl: "https://s3.example.com/presigned" }); // POST /statements
    const originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    mockApiFetch.mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "pending", uploadedAt: "2026-01-01T00:00:00.000Z" }] }); // reload

    await user.click(screen.getByRole("button", { name: /Yeni Ekstre/ }));
    const file = new File(["pdf-bytes"], "ekstre.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /Yükle/ }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("Ekstre yüklendi, işleniyor..."));
    // "Akbank" also appears as a <select> option, so assert on the status text unique to the list row.
    expect(await screen.findByText("Bekliyor")).toBeInTheDocument();
    global.XMLHttpRequest = originalXHR;
  });

  it("deletes a statement after confirmation", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValueOnce(true);
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] }); // StatementRow's eager per-statement fetch
    renderStatements();
    await screen.findByText("Akbank");

    mockApiFetch.mockResolvedValueOnce({}); // DELETE
    mockApiFetch.mockResolvedValueOnce({ statements: [] }); // reload
    mockApiFetch.mockResolvedValueOnce(emptySummary); // reload summary

    await user.click(screen.getByLabelText("Ekstreyi sil"));

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1", { method: "DELETE" }));
    expect(mockShowToast).toHaveBeenCalledWith("Ekstre silindi.");
  });

  it("requests a month-scoped summary when navigating to the next month", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ statements: [] }).mockResolvedValueOnce(emptySummary);
    renderStatements();
    await screen.findByText(/Henüz ekstre yüklenmedi/);

    mockApiFetch.mockResolvedValueOnce(emptySummary);
    await user.click(screen.getByLabelText("Sonraki ay"));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^\/spending\/summary\?month=\d{4}-\d{2}$/)),
    );
  });

  it("toggles between the statement list and the unified transactions view", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] }); // StatementRow's eager per-statement fetch
    renderStatements();
    await screen.findByText("Akbank");

    mockApiFetch.mockResolvedValueOnce({ transactions: [] }); // AllTransactionsView's per-statement fetch
    await user.click(screen.getByRole("button", { name: /Tüm İşlemler/ }));

    expect(await screen.findByPlaceholderText("Mağaza ara...")).toBeInTheDocument();
    expect(screen.queryByText("Akbank")).not.toBeInTheDocument();
  });

  it("opens category detail first, then drills into the unified transactions view from the drawer shortcut", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce({
        month: "2026-01",
        total: 150,
        byCategory: { Market: 100, Faturalar: 50 },
        byBank: { Akbank: 150 },
        topMerchants: [],
        recurring: [],
        transactionCount: 2,
      })
      .mockResolvedValueOnce({ statement: {}, transactions: [] }); // StatementRow's eager per-statement fetch
    renderStatements();
    await screen.findByText("Market");

    mockApiFetch.mockResolvedValueOnce({
      transactions: [
        { txnId: "t1", statementId: "s1", date: "2026-01-02", merchant: "Migros", amount: 100, category: "Market", isRecurring: false },
        { txnId: "t2", statementId: "s1", date: "2026-01-03", merchant: "Netflix", amount: 50, category: "Faturalar", isRecurring: false },
      ],
    }); // SpendingBreakdown category detail fetch, shared with AllTransactionsView through cache
    await user.click(screen.getByRole("button", { name: "Market kategori detayını aç" }));

    expect(await screen.findByRole("dialog", { name: "Market kategori detayı" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Tüm işlemlerde aç/ }));

    expect(await screen.findByText("Migros")).toBeInTheDocument();
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
  });

  it("filters the statement list by bank using the bank chips", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({
        statements: [
          { statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" },
          { statementId: "s2", bank: "Garanti BBVA", status: "done", uploadedAt: "2026-01-02T00:00:00.000Z" },
        ],
      })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] }) // s1 eager fetch
      .mockResolvedValueOnce({ statement: {}, transactions: [] }); // s2 eager fetch
    renderStatements();
    await screen.findAllByText("Garanti BBVA");
    expect(screen.getAllByText("Akbank")).toHaveLength(2); // bank chip + statement row

    await user.click(screen.getByRole("button", { name: "Garanti BBVA" }));

    expect(screen.getAllByText("Akbank")).toHaveLength(1); // only the bank chip remains
  });

  it("warns before uploading a statement for a bank that was uploaded within the last 20 days", async () => {
    const user = userEvent.setup();
    const recentUpload = new Date().toISOString();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "İş Bankası", status: "done", uploadedAt: recentUpload }] })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] });
    renderStatements();
    await screen.findByText("İş Bankası");

    mockConfirm.mockResolvedValueOnce(false); // kullanıcı vazgeçiyor
    await user.click(screen.getByRole("button", { name: /Yeni Ekstre/ }));
    const file = new File(["pdf-bytes"], "ekstre.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /Yükle/ }));

    await waitFor(() =>
      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Bu ekstreyi zaten yüklemiş olabilirsiniz" })),
    );
    // Kullanıcı vazgeçtiği için gerçek yükleme isteği hiç atılmamalı.
    expect(mockApiFetch).not.toHaveBeenCalledWith(expect.anything(), "/statements", expect.objectContaining({ method: "POST" }));
  });

  it("does not warn when uploading for a bank without a recent statement", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2020-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({ statement: {}, transactions: [] });
    renderStatements();
    await screen.findByText("Akbank");

    mockApiFetch.mockResolvedValueOnce({ statementId: "s2", uploadUrl: "https://s3.example.com/presigned" });
    const originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    mockApiFetch.mockResolvedValueOnce({ statements: [] });

    await user.click(screen.getByRole("button", { name: /Yeni Ekstre/ }));
    await user.selectOptions(screen.getByRole("combobox"), "Akbank");
    const file = new File(["pdf-bytes"], "ekstre.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /Yükle/ }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("Ekstre yüklendi, işleniyor..."));
    expect(mockConfirm).not.toHaveBeenCalled();
    global.XMLHttpRequest = originalXHR;
  });

  it("shows a browser notification once a previously pending statement finishes processing", async () => {
    function NotificationMock(title: string, options?: { body?: string }) {
      NotificationMock.instances.push({ title, options });
    }
    NotificationMock.instances = [] as { title: string; options?: { body?: string } }[];
    NotificationMock.permission = "granted";
    NotificationMock.requestPermission = vi.fn();
    vi.stubGlobal("Notification", NotificationMock);

    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "processing", uploadedAt: "2026-01-01T00:00:00.000Z" }] })
      .mockResolvedValueOnce(emptySummary);
    renderStatements();
    await screen.findByText("İşleniyor...");

    mockApiFetch.mockResolvedValueOnce({ statementId: "s2", uploadUrl: "https://s3.example.com/presigned" }); // POST /statements
    const originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    mockApiFetch.mockResolvedValueOnce({
      statements: [
        { statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" },
        { statementId: "s2", bank: "Garanti BBVA", status: "pending", uploadedAt: "2026-01-02T00:00:00.000Z" },
      ],
    }); // reload after upload — s1 şimdi tamamlandı

    await user.click(screen.getByRole("button", { name: /Yeni Ekstre/ }));
    await user.selectOptions(screen.getByRole("combobox"), "Garanti BBVA"); // farklı banka: tekrar uyarısı devre dışı kalsın
    const file = new File(["pdf-bytes"], "ekstre.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: /Yükle/ }));

    await waitFor(() => expect(NotificationMock.instances.length).toBe(1));
    expect(NotificationMock.instances[0].title).toBe("Ekstre işlendi");
    expect(NotificationMock.instances[0].options?.body).toContain("Akbank");

    global.XMLHttpRequest = originalXHR;
    vi.unstubAllGlobals();
  });

  it("fetches a year-over-year comparison for the resolved month", async () => {
    mockApiFetch.mockResolvedValueOnce({ statements: [] }).mockResolvedValueOnce({
      month: "2026-01",
      total: 150,
      byCategory: { Market: 150 },
      byBank: {},
      topMerchants: [],
      recurring: [],
      transactionCount: 1,
    });
    renderStatements();
    await screen.findByText("Market");

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/spending/summary?month=2025-01"));
  });

  it("serves the calendar tab's transactions from the cache the transactions view already populated", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }] }).mockResolvedValueOnce({
      month: "2026-01",
      total: 100,
      byCategory: { Market: 100 },
      byBank: { Akbank: 100 },
      topMerchants: [],
      recurring: [],
      transactionCount: 1,
    });
    renderStatements();
    await screen.findByText("Market");

    const callsToStatement = () => mockApiFetch.mock.calls.filter(([, url]) => url === "/statements/s1").length;

    mockApiFetch.mockResolvedValueOnce({
      transactions: [{ txnId: "t1", statementId: "s1", date: "2026-01-05", merchant: "Migros", amount: 100, category: "Market", isRecurring: false }],
    }); // AllTransactionsView'in loadTransactions üzerinden yaptığı ilk (önbelleği dolduran) istek
    await user.click(screen.getByRole("button", { name: /Tüm İşlemler/ }));
    await screen.findByText("Migros");
    await waitFor(() => expect(callsToStatement()).toBeGreaterThan(0));
    const callsAfterTransactionsView = callsToStatement();

    // Not: "Ekstreler" görünümüne geri dönmüyoruz — StatementRow yeniden mount olup kendi bağımsız
    // eager fetch'ini tekrar tetikler, bu da bu testin doğrulamak istediği önbellek davranışıyla
    // ilgisiz bir istekle sayacı bozar. Takvim sekmesi SpendingBreakdown içinde, "Tüm İşlemler"/
    // "Ekstreler" görünüm anahtarından bağımsız olarak zaten her zaman erişilebilir.
    await user.click(screen.getByRole("button", { name: "Takvim" }));
    await screen.findByText("Pt");

    expect(callsToStatement()).toBe(callsAfterTransactionsView); // takvim, önbellekten sunuldu — yeniden istek atılmadı
  });

  it("opens the upload form pre-filled with the same bank when retrying a failed statement", async () => {
    const user = userEvent.setup();
    mockApiFetch
      .mockResolvedValueOnce({
        statements: [
          { statementId: "s1", bank: "Garanti BBVA", status: "failed", errorMessage: "PDF okunamadı.", uploadedAt: "2026-01-01T00:00:00.000Z" },
        ],
      })
      .mockResolvedValueOnce(emptySummary);
    renderStatements();
    await screen.findByText("Garanti BBVA");

    await user.click(screen.getByLabelText("Yeniden yükle"));

    expect(screen.getByRole("combobox")).toHaveValue("Garanti BBVA");
    expect(screen.getByRole("button", { name: /Yükle/ })).toBeInTheDocument();
  });
});
