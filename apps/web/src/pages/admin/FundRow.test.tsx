import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FundRow } from "./FundRow";

const { mockApiFetch, mockShowToast, mockConfirm } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
  mockConfirm: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ getIdToken: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));
vi.mock("./ConfirmDialog", () => ({ useConfirm: () => mockConfirm }));

const fund = { fundCode: "AFA", name: "Fon A", netUnits: 10, latestPrice: 5, latestPriceDate: "2026-01-01", currentValue: 50 };

beforeEach(() => {
  mockApiFetch.mockReset();
  mockShowToast.mockReset();
  mockConfirm.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FundRow", () => {
  it("renders the fund code, name and current value", () => {
    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    expect(screen.getByText("AFA")).toBeInTheDocument();
    expect(screen.getByText(/Fon A/)).toBeInTheDocument();
  });

  it("loads and displays price and transaction history on expand", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ prices: [{ date: "2026-01-01", price: 5 }] });
    mockApiFetch.mockResolvedValueOnce({ transactions: [{ txnId: "t1", date: "2026-01-02", type: "BUY", units: 10, price: 5 }] });

    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByText(/Fon A/));

    expect(await screen.findByText("2026-01-01")).toBeInTheDocument();
    expect(await screen.findByText("2026-01-02")).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds/AFA/prices");
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds/AFA/transactions");
  });

  it("saves an edited fund name", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    mockApiFetch.mockResolvedValueOnce({});

    render(
      <ul>
        <FundRow fund={fund} onChanged={onChanged} />
      </ul>,
    );

    await user.click(screen.getByLabelText("Fon adını düzenle"));
    const input = screen.getByDisplayValue("Fon A");
    await user.clear(input);
    await user.type(input, "Fon A Güncel");
    await user.click(screen.getByLabelText("Kaydet"));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds/AFA", { method: "PUT", body: JSON.stringify({ name: "Fon A Güncel" }) }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("Fon adı güncellendi.");
    expect(onChanged).toHaveBeenCalled();
  });

  it("deletes the fund after confirmation", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    mockConfirm.mockResolvedValueOnce(true);
    mockApiFetch.mockResolvedValueOnce({});

    render(
      <ul>
        <FundRow fund={fund} onChanged={onChanged} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Fonu sil"));

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds/AFA", { method: "DELETE" }));
    expect(onChanged).toHaveBeenCalled();
  });

  it("does not delete the fund when the confirmation is declined", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValueOnce(false);

    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Fonu sil"));

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("optimistically removes a price on delete and confirms the DELETE call after the undo window", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ prices: [{ date: "2026-01-01", price: 5 }] });
    mockApiFetch.mockResolvedValueOnce({ transactions: [] });

    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByText(/Fon A/));
    await screen.findByText("2026-01-01");

    vi.useFakeTimers();
    mockApiFetch.mockResolvedValueOnce({}); // DELETE /funds/AFA/prices/2026-01-01
    fireEvent.click(screen.getByLabelText("Fiyatı sil"));
    await vi.advanceTimersByTimeAsync(0);

    expect(screen.queryByText("2026-01-01")).not.toBeInTheDocument();
    expect(mockApiFetch).not.toHaveBeenCalledWith(expect.anything(), "/funds/AFA/prices/2026-01-01", { method: "DELETE" });

    await vi.advanceTimersByTimeAsync(4000);
    expect(mockApiFetch).toHaveBeenCalledWith(expect.anything(), "/funds/AFA/prices/2026-01-01", { method: "DELETE" });
  });

  it("restores a deleted price when the undo toast action is invoked", async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce({ prices: [{ date: "2026-01-01", price: 5 }] });
    mockApiFetch.mockResolvedValueOnce({ transactions: [] });

    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByText(/Fon A/));
    await screen.findByText("2026-01-01");

    await user.click(screen.getByLabelText("Fiyatı sil"));
    expect(screen.queryByText("2026-01-01")).not.toBeInTheDocument();

    const lastCall = mockShowToast.mock.calls[mockShowToast.mock.calls.length - 1];
    const options = lastCall[2] as { action: { onClick: () => void } };
    options.action.onClick();

    expect(await screen.findByText("2026-01-01")).toBeInTheDocument();
  });

  it("shows a profit/loss badge when profitLoss is provided", () => {
    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} profitLoss={{ amount: 10, percent: 25 }} />
      </ul>,
    );

    expect(screen.getByText("+25.0%")).toBeInTheDocument();
  });
});
