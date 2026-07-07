import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpendingBreakdown } from "./SpendingBreakdown";

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ getIdToken: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));

function renderBreakdown(overrides: Partial<Parameters<typeof SpendingBreakdown>[0]> = {}) {
  return render(
    <SpendingBreakdown
      total={150}
      transactionCount={3}
      byCategory={{ Market: 100, "Faturalar/Abonelikler": 50 }}
      byBank={{ Akbank: 150 }}
      topMerchants={[{ merchant: "Netflix", amount: 50, count: 1 }]}
      recurring={[{ merchant: "Netflix", amount: 50, date: "2026-01-05" }]}
      pendingCount={0}
      onCategoryClick={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  mockApiFetch.mockReset();
});

describe("SpendingBreakdown", () => {
  it("renders category rows as full-width buttons so the progress bar actually has room to render", () => {
    renderBreakdown();
    const marketButton = screen.getByRole("button", { name: "Market kategori detayını aç" });
    expect(marketButton.className).toMatch(/\bw-full\b/);
  });

  it("calls onCategoryClick when a category row is clicked", async () => {
    const user = userEvent.setup();
    const onCategoryClick = vi.fn();
    renderBreakdown({ onCategoryClick });

    await user.click(screen.getByRole("button", { name: "Market kategori detayını aç" }));

    expect(onCategoryClick).toHaveBeenCalledWith("Market");
  });

  it("opens a category detail drawer when transactions are available, with a shortcut to the unified view", async () => {
    const user = userEvent.setup();
    const onCategoryClick = vi.fn();
    const loadTransactions = vi.fn(async () => ({
      s1: [
        {
          txnId: "t1",
          statementId: "s1",
          date: "2026-01-05",
          merchant: "Migros",
          amount: 100,
          category: "Market",
          isRecurring: false,
        },
      ],
    }));
    renderBreakdown({
      onCategoryClick,
      activeMonth: "2026-01",
      statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }],
      loadTransactions,
    });

    await user.click(screen.getByRole("button", { name: "Market kategori detayını aç" }));

    expect(await screen.findByRole("dialog", { name: "Market kategori detayı" })).toBeInTheDocument();
    expect(screen.getAllByText("Migros").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Tüm işlemlerde aç/ }));
    expect(onCategoryClick).toHaveBeenCalledWith("Market");
  });

  it("switches between category, bank, and merchant tabs", async () => {
    const user = userEvent.setup();
    renderBreakdown();

    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.queryByText("Akbank")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Banka" }));
    expect(screen.getByText("Akbank")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İşyerleri" }));
    expect(screen.getByText("1 işlem")).toBeInTheDocument();
  });

  it("keeps recurring payments collapsed until the summary line is clicked", async () => {
    const user = userEvent.setup();
    renderBreakdown();

    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
    await user.click(screen.getByText(/düzenli ödemeler/));
    expect(await screen.findByText("Netflix")).toBeInTheDocument();
  });

  it("shows a month-over-month change badge derived from the trend data", () => {
    renderBreakdown({
      trend: [
        { month: "2025-12", total: 100, byCategory: { Market: 100 }, transactionCount: 2 },
        { month: "2026-01", total: 150, byCategory: { Market: 150 }, transactionCount: 3 },
      ],
      activeMonth: "2026-01",
    });

    expect(screen.getByText("%50")).toBeInTheDocument();
  });

  it("omits the trend section entirely when no trend data is available", () => {
    renderBreakdown({ trend: null });
    expect(screen.queryByText(/Son \d+ Ay/)).not.toBeInTheDocument();
  });

  it("omits all summary insight chips", () => {
    renderBreakdown({
      trend: [
        { month: "2025-12", total: 100, byCategory: { Eğlence: 50 }, transactionCount: 2 },
        { month: "2026-01", total: 150, byCategory: { Eğlence: 150 }, transactionCount: 3 },
      ],
      activeMonth: "2026-01",
      maxTransaction: { merchant: "Migros", amount: 250, date: "2026-01-05", category: "Market" },
      yearTotal: 1200,
    });

    expect(screen.queryByText(/Eğlence %200 arttı/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026 toplam/)).not.toBeInTheDocument();
    expect(screen.queryByText(/En büyük harcama: Migros/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ort\. işlem/)).not.toBeInTheDocument();
  });

  it("sets and clears a category budget, coloring the bar red when over budget", async () => {
    const user = userEvent.setup();
    const onSetBudget = vi.fn();
    renderBreakdown({ byCategory: { Market: 100 }, budgets: { Market: 50 }, onSetBudget });

    expect(screen.getByText("₺100,00 / ₺50,00 · %200")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Market bütçesini belirle"));
    expect(screen.getByPlaceholderText("Aylık bütçe (TL)")).toHaveValue(50);

    await user.clear(screen.getByPlaceholderText("Aylık bütçe (TL)"));
    await user.type(screen.getByPlaceholderText("Aylık bütçe (TL)"), "200");
    await user.click(screen.getByLabelText("Kaydet"));

    expect(onSetBudget).toHaveBeenCalledWith("Market", 200);
  });

  it("sets and clears a bank card limit, coloring the bar red when exceeded", async () => {
    const user = userEvent.setup();
    const onSetBankLimit = vi.fn();
    renderBreakdown({ byBank: { Akbank: 100 }, bankLimits: { Akbank: 50 }, onSetBankLimit });

    await user.click(screen.getByRole("button", { name: "Banka" }));
    await user.click(screen.getByLabelText("Akbank limitini belirle"));
    expect(screen.getByPlaceholderText("Aylık kart limiti (TL)")).toHaveValue(50);

    await user.clear(screen.getByPlaceholderText("Aylık kart limiti (TL)"));
    await user.type(screen.getByPlaceholderText("Aylık kart limiti (TL)"), "200");
    await user.click(screen.getByLabelText("Kaydet"));

    expect(onSetBankLimit).toHaveBeenCalledWith("Akbank", 200);
  });

  it("keeps limit exceedance in the health summary instead of duplicating it as a chip", () => {
    renderBreakdown({
      byCategory: { Market: 150 },
      budgets: { Market: 100 },
      byBank: { Akbank: 150 },
      bankLimits: { Akbank: 100 },
    });

    expect(screen.queryByText(/2 kategori\/bankada limit aşıldı/)).not.toBeInTheDocument();
    expect(screen.getByText(/bütçe sınırı aşıldı/)).toBeInTheDocument();
  });

  it("reveals a per-category mini trend chart on demand", async () => {
    const user = userEvent.setup();
    renderBreakdown({
      byCategory: { Market: 100 },
      trend: [
        { month: "2025-12", total: 80, byCategory: { Market: 60 }, transactionCount: 2 },
        { month: "2026-01", total: 100, byCategory: { Market: 100 }, transactionCount: 3 },
      ],
      activeMonth: "2026-01",
    });

    await user.click(screen.getByLabelText("Market trendini gör"));

    // "Ara" (Aralık) hem üstteki genel trend şeridinde hem de yeni açılan kategori mini
    // trendinde görünür — ikisinin de render olduğunu doğrular.
    expect(screen.getAllByText("Ara").length).toBe(2);
  });

  it("shows a Takvim tab when statements are provided, rendering the calendar heatmap", async () => {
    const user = userEvent.setup();
    const loadTransactions = vi.fn(async () => ({
      s1: [{ txnId: "t1", statementId: "s1", date: "2026-01-05", merchant: "Migros", amount: 50, category: "Market", isRecurring: false }],
    }));
    renderBreakdown({
      activeMonth: "2026-01",
      statements: [{ statementId: "s1", bank: "Akbank", status: "done", uploadedAt: "2026-01-01T00:00:00.000Z" }],
      loadTransactions,
    });

    await user.click(screen.getByRole("button", { name: "Takvim" }));

    expect(await screen.findByText("Pt")).toBeInTheDocument();
  });
});
