import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FundRow } from "./FundRow";

const { mockApiFetch, mockShowToast } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ getIdToken: vi.fn() }) }));
vi.mock("../../auth/api", () => ({ apiFetch: mockApiFetch }));
vi.mock("./Toast", () => ({ useToast: () => ({ showToast: mockShowToast }) }));

const fund = { fundCode: "AFA", name: "Fon A", netUnits: 10, latestPrice: 5, latestPriceDate: "2026-01-01", currentValue: 50 };

beforeEach(() => {
  mockApiFetch.mockReset();
  mockShowToast.mockReset();
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
    vi.spyOn(window, "confirm").mockReturnValue(true);
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
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <ul>
        <FundRow fund={fund} onChanged={vi.fn()} />
      </ul>,
    );
    await user.click(screen.getByLabelText("Fonu sil"));

    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
