import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

const { mockToggleTheme } = vi.hoisted(() => ({ mockToggleTheme: vi.fn() }));

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ email: "admin@example.com", signOut: vi.fn() }) }));
vi.mock("../../theme/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", toggleTheme: mockToggleTheme }) }));

function renderLayout() {
  return render(
    <MemoryRouter>
      <AdminLayout>
        <p>İçerik</p>
      </AdminLayout>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("renders the email, nav tabs, and children", () => {
    renderLayout();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Portföy")).toBeInTheDocument();
    expect(screen.getByText("Harcamalar")).toBeInTheDocument();
    expect(screen.getByText("İçerik")).toBeInTheDocument();
  });

  it("toggles the theme when the theme button is clicked", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText("Aydınlık moda geç"));

    expect(mockToggleTheme).toHaveBeenCalled();
  });
});
