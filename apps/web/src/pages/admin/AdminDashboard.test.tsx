import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminDashboard } from "./AdminDashboard";

const { mockApiFetch, mockShowToast } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ email: "admin@example.com", getIdToken: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  mockShowToast.mockReset();
});

describe("AdminDashboard", () => {
  it("shows an empty state when there are no funds", async () => {
    mockApiFetch.mockResolvedValueOnce({ funds: [], totalValue: 0 });
    render(<AdminDashboard />);

    expect(await screen.findByText(/Henüz fon eklenmedi/)).toBeInTheDocument();
  });

  it("shows an error message when the summary request fails", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("İstek başarısız oldu (500)"));
    render(<AdminDashboard />);

    expect(await screen.findByText("İstek başarısız oldu (500)")).toBeInTheDocument();
  });

  it("renders the total portfolio value and each fund", async () => {
    mockApiFetch.mockResolvedValueOnce({
      funds: [{ fundCode: "AFA", name: "Fon A", netUnits: 10, latestPrice: 5, latestPriceDate: "2026-01-01", currentValue: 50 }],
      totalValue: 50,
    });
    render(<AdminDashboard />);

    expect(await screen.findByText(/AFA/)).toBeInTheDocument();
    // The total-value card and the fund row both show "50,00" (same amount) — expect both.
    expect(screen.getAllByText(/50,00/).length).toBe(2);
  });

  it("submits the add-fund form and reloads the summary", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ funds: [], totalValue: 0 }); // initial load
    render(<AdminDashboard />);
    await screen.findByText(/Henüz fon eklenmedi/);

    mockApiFetch.mockResolvedValueOnce({}); // POST /funds
    mockApiFetch.mockResolvedValueOnce({ funds: [{ fundCode: "BFB", name: "Fon B", netUnits: 0, latestPrice: null, latestPriceDate: null, currentValue: null }], totalValue: 0 }); // reload

    await user.type(screen.getByPlaceholderText("örn. AFA"), "bfb");
    await user.type(screen.getByPlaceholderText("örn. Ak Portföy Alternatif Enerji Fonu"), "Fon B");
    await user.click(screen.getByRole("button", { name: /Fon ekle/ }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("Fon eklendi."));
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds", { method: "POST", body: JSON.stringify({ fundCode: "bfb", name: "Fon B" }) });
    expect(await screen.findByText(/BFB/)).toBeInTheDocument();
  });
});
