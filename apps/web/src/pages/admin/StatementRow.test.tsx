import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatementRow, type Statement } from "./StatementRow";

const { mockApiFetch, mockShowToast, mockConfirm } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
  mockConfirm: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ getIdToken: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));
vi.mock("./ConfirmDialog", () => ({ useConfirm: () => mockConfirm }));

const doneStatement: Statement = { statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" };

beforeEach(() => {
  mockApiFetch.mockReset();
  mockShowToast.mockReset();
  mockConfirm.mockReset().mockResolvedValue(true);
});

describe("StatementRow", () => {
  it("shows a spinner next to pending/processing statements", () => {
    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, status: "processing" }} onChanged={vi.fn()} />
      </ul>,
    );
    expect(screen.getByText("İşleniyor...")).toBeInTheDocument();
  });

  it("shows the current processor stage for active statements", () => {
    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, status: "processing", processingStage: "extracting" }} onChanged={vi.fn()} />
      </ul>,
    );
    expect(screen.getByText("İşlemler çıkarılıyor")).toBeInTheDocument();
  });

  it("shows review metadata for statements that completed with low-confidence items", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ statement: {}, transactions: [] });

    render(
      <ul>
        <StatementRow
          statement={{ ...doneStatement, status: "needs_review", transactionCount: 2, totalExtracted: 125, lowConfidenceCount: 1, reviewIssueCount: 1 }}
          onChanged={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText("Kontrol gerekli")).toBeInTheDocument();
    expect(screen.getByText("2 işlem")).toBeInTheDocument();
    expect(screen.getByText("₺125,00")).toBeInTheDocument();

    await user.hover(screen.getByText("Kontrol gerekli"));

    expect(await screen.findByText(/kategori güveni düşük/)).toBeInTheDocument();
  });

  it("shows extracted versus expected transaction counts when statement reconciliation finds missing rows", async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <StatementRow
          statement={{
            ...doneStatement,
            status: "needs_review",
            transactionCount: 27,
            statementTransactionCount: 34,
            missingTransactionCount: 7,
            reviewIssueCount: 7,
          }}
          onChanged={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText("27 / 34 işlem")).toBeInTheDocument();

    await user.hover(screen.getByText("Kontrol gerekli"));

    expect(await screen.findByText(/34 dönem içi işlem/)).toBeInTheDocument();
    expect(screen.getByText(/27 işlem çıkarıldı/)).toBeInTheDocument();
  });

  it("flags an amount mismatch even when the PDF never prints an explicit transaction count", async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <StatementRow
          statement={{
            ...doneStatement,
            status: "needs_review",
            transactionCount: 27,
            totalExtracted: 15000,
            statementPeriodAmount: 54115.33,
            amountMismatch: true,
            reviewIssueCount: 1,
          }}
          onChanged={vi.fn()}
        />
      </ul>,
    );

    const total = screen.getByText("₺15.000,00");
    expect(total.className).toMatch(/text-amber-300/);

    await user.hover(screen.getByText("Kontrol gerekli"));

    expect(await screen.findByText(/PDF'te dönem içi işlem tutarı ₺54\.115,33 görünüyor/)).toBeInTheDocument();
  });

  it("lets you manually correct an incorrectly detected statement period", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    mockApiFetch.mockResolvedValueOnce({ statement: {}, transactions: [] }); // per-statement eager fetch on expand

    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, statementMonth: "2026-04" }} onChanged={onChanged} />
      </ul>,
    );

    await user.click(screen.getByLabelText("Akbank ekstresini aç"));
    expect(await screen.findByText("Ekstre dönemi: Nisan 2026")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Ekstre dönemini düzelt"));
    const monthInput = screen.getByLabelText("Ekstre dönemi");
    await user.clear(monthInput);
    await user.type(monthInput, "2026-05");

    mockApiFetch.mockResolvedValueOnce({ statementMonth: "2026-05", outOfPeriodCount: 0 }); // PUT
    await user.click(screen.getByLabelText("Ekstre dönemini kaydet"));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1", {
        method: "PUT",
        body: JSON.stringify({ statementMonth: "2026-05" }),
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("Ekstre dönemi güncellendi.");
    expect(onChanged).toHaveBeenCalled();
  });

  it("shows the extracted statement month and upload date without a visible upload label", () => {
    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, statementMonth: "2026-06" }} onChanged={vi.fn()} />
      </ul>,
    );

    expect(screen.queryByText(/Yüklendi/)).not.toBeInTheDocument();
    expect(screen.getByText("01.01.2026")).toBeInTheDocument();
    expect(screen.getByText(/Ekstre Haziran 2026/)).toBeInTheDocument();
  });

  it("does not fetch statement transactions until the accordion is opened", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ statement: {}, transactions: [] });

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={vi.fn()} />
      </ul>,
    );

    expect(mockApiFetch).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText("Akbank ekstresini aç"));

    expect(await screen.findByText("İşlem bulunamadı.")).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1");
  });

  it("shows the error message in a tooltip-triggering element for failed statements", () => {
    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, status: "failed", errorMessage: "PDF okunamadı." }} onChanged={vi.fn()} />
      </ul>,
    );
    expect(screen.getByText("Hata")).toBeInTheDocument();
  });

  it("sanitizes long AWS processor errors in the failed statement tooltip", async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <StatementRow
          statement={{
            ...doneStatement,
            status: "failed",
            errorMessage:
              "User: arn:aws:sts::761018862186:assumed-role/emrecancioglu-personal-site-statement-processor is not authorized to perform: dynamodb:GetItem on resource: arn:aws:dynamodb:eu-north-1:761018862186:table/x",
          }}
          onChanged={vi.fn()}
        />
      </ul>,
    );

    await user.hover(screen.getByText("Hata"));

    expect(await screen.findByText(/işlemci yetkisi eksik/)).toBeInTheDocument();
    expect(screen.queryByText(/arn:aws/)).not.toBeInTheDocument();
  });

  it("expands a done statement to show its transactions and a PDF download link", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({
      statement: { ...doneStatement, downloadUrl: "https://s3.example.com/download" },
      transactions: [{ date: "2026-01-02", merchant: "Migros", amount: 250, category: "Market", isRecurring: false }],
    });

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByText("Akbank"));

    expect(await screen.findByText("Migros")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Orijinal PDF'i görüntüle" })).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1");
  });

  it("refreshes the presigned PDF URL before opening the original statement", async () => {
    const user = userEvent.setup();
    const popup = { opener: null, location: { href: "" }, close: vi.fn() };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    mockApiFetch
      .mockResolvedValueOnce({
        statement: { ...doneStatement, downloadUrl: "https://s3.example.com/old-download" },
        transactions: [{ date: "2026-01-02", merchant: "Migros", amount: 250, category: "Market", isRecurring: false }],
      })
      .mockResolvedValueOnce({
        statement: { ...doneStatement, downloadUrl: "https://s3.example.com/fresh-download" },
        transactions: [],
      });

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Akbank ekstresini aç"));
    await user.click(await screen.findByRole("button", { name: "Orijinal PDF'i görüntüle" }));

    expect(mockApiFetch).toHaveBeenLastCalledWith(expect.anything(), "/statements/s1");
    expect(openSpy).toHaveBeenCalledWith("about:blank", "_blank");
    expect(popup.location.href).toBe("https://s3.example.com/fresh-download");

    openSpy.mockRestore();
  });

  it("deletes the statement after confirmation", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    mockApiFetch.mockResolvedValueOnce({}); // DELETE

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={onChanged} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Ekstreyi sil"));

    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1", { method: "DELETE" });
    expect(onChanged).toHaveBeenCalled();
  });

  it("shows the statement's total once its transactions load", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({
      statement: {},
      transactions: [
        { date: "2026-01-02", merchant: "Migros", amount: 250, category: "Market", isRecurring: false },
        { date: "2026-01-03", merchant: "Netflix", amount: 50, category: "Faturalar", isRecurring: true },
      ],
    });

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={vi.fn()} />
      </ul>,
    );

    await user.click(screen.getByLabelText("Akbank ekstresini aç"));

    expect(await screen.findByText("₺300,00")).toBeInTheDocument();
  });

  it("shows a retry button for failed statements that calls onRetry with the bank", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ul>
        <StatementRow statement={{ ...doneStatement, status: "failed", errorMessage: "PDF okunamadı." }} onChanged={vi.fn()} onRetry={onRetry} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Yeniden yükle"));

    expect(onRetry).toHaveBeenCalledWith("Akbank");
  });

  it("changes a transaction's category and remembers it for future statements from the same merchant", async () => {
    const user = userEvent.setup();
    const onCategoryChanged = vi.fn();
    mockApiFetch.mockResolvedValueOnce({
      statement: {},
      transactions: [{ txnId: "t1", date: "2026-01-02", merchant: "Migros", amount: 250, category: "Diğer", isRecurring: false }],
    });
    mockApiFetch.mockResolvedValueOnce({ category: "Market" }); // PUT

    render(
      <ul>
        <StatementRow statement={doneStatement} onChanged={vi.fn()} onCategoryChanged={onCategoryChanged} />
      </ul>,
    );
    await user.click(screen.getByText("Akbank"));

    const picker = await screen.findByLabelText("Diğer kategorisini değiştir");
    await user.selectOptions(picker, "Market");

    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1/transactions/t1", {
      method: "PUT",
      body: JSON.stringify({ category: "Market" }),
    });
    expect(await screen.findByLabelText("Market kategorisini değiştir")).toBeInTheDocument();
    expect(onCategoryChanged).toHaveBeenCalled();
  });
});
