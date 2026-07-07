import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AllTransactionsView } from "./AllTransactionsView";
import type { CachedTransaction } from "./Statements";
import type { Statement } from "./StatementRow";

const { mockApiFetch, mockShowToast } = vi.hoisted(() => ({ mockApiFetch: vi.fn(), mockShowToast: vi.fn() }));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ getIdToken: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));

const statements: Statement[] = [
  { statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" },
  { statementId: "s2", bank: "Garanti BBVA", status: "done", uploadedAt: "2026-01-02T00:00:00.000Z" },
  { statementId: "s3", bank: "QNB", status: "pending", uploadedAt: "2026-01-03T00:00:00.000Z" },
];

function loaderFor(byStatement: Record<string, CachedTransaction[]>) {
  return vi.fn(async (ids: string[]) => Object.fromEntries(ids.map((id) => [id, byStatement[id] ?? []])));
}

const migros: CachedTransaction = { txnId: "t1", statementId: "s1", date: "2026-01-02", merchant: "Migros", amount: 250, category: "Market", isRecurring: false };
const netflix: CachedTransaction = { txnId: "t2", statementId: "s2", date: "2026-01-03", merchant: "Netflix", amount: 50, category: "Faturalar", isRecurring: true };

beforeEach(() => {
  mockApiFetch.mockReset();
});

describe("AllTransactionsView", () => {
  it("merges transactions from every done statement, skipping pending ones", async () => {
    const loadTransactions = loaderFor({ s1: [migros], s2: [netflix] });
    render(<AllTransactionsView statements={statements} monthFilter={null} loadTransactions={loadTransactions} />);

    expect(await screen.findByText("Migros")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(loadTransactions).toHaveBeenCalledWith(["s1", "s2"]); // s3 "pending", dahil edilmiyor
  });

  it("filters merged transactions by merchant search", async () => {
    const user = userEvent.setup();
    render(<AllTransactionsView statements={statements} monthFilter={null} loadTransactions={loaderFor({ s1: [migros], s2: [netflix] })} />);
    await screen.findByText("Migros");

    await user.type(screen.getByPlaceholderText("Mağaza ara..."), "netflix");

    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.queryByText("Migros")).not.toBeInTheDocument();
  });

  it("scopes transactions to the selected month", async () => {
    const marchNetflix = { ...netflix, date: "2026-02-03" };
    render(
      <AllTransactionsView
        statements={statements}
        monthFilter="2026-01"
        loadTransactions={loaderFor({ s1: [migros], s2: [marchNetflix] })}
      />,
    );

    expect(await screen.findByText("Migros")).toBeInTheDocument();
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
  });

  it("filters by category chip and preselects the initialCategory", async () => {
    render(
      <AllTransactionsView
        statements={statements}
        monthFilter={null}
        initialCategory="Faturalar"
        loadTransactions={loaderFor({ s1: [migros], s2: [netflix] })}
      />,
    );

    expect(await screen.findByText("Netflix")).toBeInTheDocument();
    expect(screen.queryByText("Migros")).not.toBeInTheDocument();
  });

  it("filters low-confidence AI category assignments into a review queue", async () => {
    const user = userEvent.setup();
    render(
      <AllTransactionsView
        statements={statements}
        monthFilter={null}
        loadTransactions={loaderFor({ s1: [{ ...migros, categoryConfidence: 0.42 }], s2: [{ ...netflix, categoryConfidence: 0.95 }] })}
      />,
    );
    await screen.findByText("Migros");

    await user.click(screen.getByRole("button", { name: /Kontrol edilmeli/ }));

    expect(screen.getByText("Migros")).toBeInTheDocument();
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Kategori kontrol edilmeli")).toBeInTheDocument();
  });

  it("shows the filtered count and total, and marks recurring transactions", async () => {
    render(<AllTransactionsView statements={statements} monthFilter={null} loadTransactions={loaderFor({ s1: [migros], s2: [netflix] })} />);
    await screen.findByText("Migros");

    expect(screen.getByText("2 işlem")).toBeInTheDocument();
    expect(screen.getByText("₺300,00")).toBeInTheDocument();
    expect(screen.getByLabelText("Düzenli ödeme")).toBeInTheDocument();
  });

  it("toggles sorting between date and amount", async () => {
    const user = userEvent.setup();
    render(<AllTransactionsView statements={statements} monthFilter={null} loadTransactions={loaderFor({ s1: [migros], s2: [netflix] })} />);
    await screen.findByText("Migros");

    expect(screen.getByRole("button", { name: /Tarih/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Tarih/ }));
    expect(screen.getByRole("button", { name: /Tutar/ })).toBeInTheDocument();
  });

  it("changes a transaction's category via the picker and notifies the parent", async () => {
    const onCategoryChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <AllTransactionsView
        statements={statements}
        monthFilter={null}
        onCategoryChanged={onCategoryChanged}
        loadTransactions={loaderFor({ s1: [migros] })}
      />,
    );
    await screen.findByText("Migros");

    mockApiFetch.mockResolvedValueOnce({ category: "Ev/Yaşam" }); // PUT
    await user.selectOptions(screen.getByLabelText("Market kategorisini değiştir"), "Ev/Yaşam");

    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/statements/s1/transactions/t1", {
      method: "PUT",
      body: JSON.stringify({ category: "Ev/Yaşam" }),
    });
    expect(await screen.findByLabelText("Ev/Yaşam kategorisini değiştir")).toBeInTheDocument();
    expect(onCategoryChanged).toHaveBeenCalledWith("s1");
  });

  it("ignores the month filter once a custom date range is set, and can be cleared", async () => {
    const marchNetflix = { ...netflix, date: "2026-03-15" };
    const user = userEvent.setup();
    render(
      <AllTransactionsView statements={statements} monthFilter="2026-01" loadTransactions={loaderFor({ s1: [migros], s2: [marchNetflix] })} />,
    );
    await screen.findByText("Migros");
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument(); // Mart, seçili Ocak ayının dışında

    await user.type(screen.getByLabelText("Başlangıç tarihi"), "2026-03-01");
    await user.type(screen.getByLabelText("Bitiş tarihi"), "2026-03-31");

    expect(await screen.findByText("Netflix")).toBeInTheDocument();
    expect(screen.queryByText("Migros")).not.toBeInTheDocument();

    await user.click(screen.getByText("Özel aralığı temizle, seçili aya dön"));
    expect(await screen.findByText("Migros")).toBeInTheDocument();
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
  });

  it("exports the currently filtered transactions as a CSV download", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<AllTransactionsView statements={statements} monthFilter="2026-01" loadTransactions={loaderFor({ s1: [migros] })} />);
    await screen.findByText("Migros");

    await user.click(screen.getByRole("button", { name: /CSV/ }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
