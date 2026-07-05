import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock("../auth/AuthContext", () => ({ useAuth: mockUseAuth }));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin/login" element={<p>Login page</p>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <p>Secret dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while auth status is being resolved", () => {
    mockUseAuth.mockReturnValue({ status: "loading" });
    renderProtected();
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("redirects to /admin/login when not signed in", () => {
    mockUseAuth.mockReturnValue({ status: "signed-out" });
    renderProtected();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the protected content when signed in", () => {
    mockUseAuth.mockReturnValue({ status: "signed-in" });
    renderProtected();
    expect(screen.getByText("Secret dashboard")).toBeInTheDocument();
  });
});
