import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";

const { mockApiFetch, mockShowToast } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ email: "admin@example.com", getIdToken: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("../../theme/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));
vi.mock("./ConfirmDialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(true) }));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockShowToast.mockReset();
});

describe("AdminDashboard", () => {
  it("shows an empty state when there are no funds", async () => {
    mockApiFetch.mockResolvedValueOnce({ funds: [], totalValue: 0 });
    renderDashboard();

    expect(await screen.findByText(/Henüz fon eklenmedi/)).toBeInTheDocument();
  });

  it("shows an error message when the summary request fails", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("İstek başarısız oldu (500)"));
    renderDashboard();

    expect(await screen.findByText("İstek başarısız oldu (500)")).toBeInTheDocument();
  });

  it("renders the total portfolio value and each fund", async () => {
    mockApiFetch.mockResolvedValueOnce({
      funds: [{ fundCode: "AFA", name: "Fon A", netUnits: 10, latestPrice: 5, latestPriceDate: "2026-01-01", currentValue: 50 }],
      totalValue: 50,
    });
    renderDashboard();

    expect(await screen.findByText(/AFA/)).toBeInTheDocument();
    // The total-value card and the fund row both show "50,00" (same amount) — expect both.
    expect(screen.getAllByText(/50,00/).length).toBe(2);
  });

  it("submits the add-fund form and reloads the summary", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ funds: [], totalValue: 0 }); // initial load
    renderDashboard();
    await screen.findByText(/Henüz fon eklenmedi/);

    mockApiFetch.mockResolvedValueOnce({}); // POST /funds
    mockApiFetch.mockResolvedValueOnce({ funds: [{ fundCode: "BFB", name: "Fon B", netUnits: 0, latestPrice: null, latestPriceDate: null, currentValue: null }], totalValue: 0 }); // reload

    await user.click(screen.getByRole("button", { name: /Yeni Fon/ }));
    await user.type(screen.getByPlaceholderText("örn. AFA"), "bfb");
    await user.type(screen.getByPlaceholderText("örn. Ak Portföy Alternatif Enerji Fonu"), "Fon B");
    await user.click(screen.getByRole("button", { name: /Ekle/ }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("Fon eklendi."));
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds", { method: "POST", body: JSON.stringify({ fundCode: "bfb", name: "Fon B" }) });
    expect(await screen.findByText(/BFB/)).toBeInTheDocument();
  });

  it("filters the fund list by search query", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({
      funds: [
        { fundCode: "AFA", name: "Fon A", netUnits: 10, latestPrice: 5, latestPriceDate: "2026-01-01", currentValue: 50 },
        { fundCode: "BFB", name: "Fon B", netUnits: 5, latestPrice: 10, latestPriceDate: "2026-01-01", currentValue: 50 },
      ],
      totalValue: 100,
    });
    renderDashboard();
    await screen.findByText(/AFA/);
    expect(screen.getByText(/BFB/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Fon ara..."), "AFA");

    expect(screen.getByText(/AFA/)).toBeInTheDocument();
    expect(screen.queryByText(/BFB/)).not.toBeInTheDocument();
  });

  it("opens the add-fund form with 'n' and closes it with Escape", async () => {
    mockApiFetch.mockResolvedValueOnce({ funds: [], totalValue: 0 });
    renderDashboard();
    await screen.findByText(/Henüz fon eklenmedi/);

    fireEvent.keyDown(window, { key: "n" });
    expect(await screen.findByPlaceholderText("örn. AFA")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByPlaceholderText("örn. AFA")).not.toBeInTheDocument());
  });
});
