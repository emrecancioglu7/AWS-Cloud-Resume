import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminLogin } from "./AdminLogin";

const { mockUseAuth, mockSignIn } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSignIn: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,x") } }));

function renderLogin(overrides: Partial<ReturnType<typeof mockUseAuth>> = {}) {
  mockUseAuth.mockReturnValue({
    status: "signed-out",
    email: null,
    mfaSetupSecret: null,
    signIn: mockSignIn,
    completeNewPassword: vi.fn(),
    confirmMfaSetup: vi.fn(),
    confirmMfaCode: vi.fn(),
    ...overrides,
  });
  return render(
    <MemoryRouter>
      <AdminLogin />
    </MemoryRouter>,
  );
}

describe("AdminLogin", () => {
  it("renders the sign-in form when signed out", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("E-posta")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Şifre")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giriş yap" })).toBeInTheDocument();
  });

  it("calls signIn with the entered credentials", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("E-posta"), "admin@example.com");
    await user.type(screen.getByPlaceholderText("Şifre"), "password123");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(mockSignIn).toHaveBeenCalledWith("admin@example.com", "password123");
  });

  it("shows the new-password form when a new password is required", () => {
    renderLogin({ status: "new-password-required" });
    expect(screen.getByPlaceholderText("Yeni şifre (en az 12 karakter)")).toBeInTheDocument();
  });

  it("shows the MFA setup form with the QR code when mfa-setup is required", async () => {
    renderLogin({ status: "mfa-setup", email: "admin@example.com", mfaSetupSecret: "SECRET123" });
    expect(await screen.findByAltText("TOTP QR kodu")).toBeInTheDocument();
    expect(screen.getByText("SECRET123")).toBeInTheDocument();
  });

  it("shows the MFA code form when mfa-required", () => {
    renderLogin({ status: "mfa-required" });
    expect(screen.getByLabelText("Kod hanesi 1")).toBeInTheDocument();
  });

  it("auto-submits the MFA code once all 6 digits are entered", async () => {
    const user = userEvent.setup();
    const confirmMfaCode = vi.fn().mockResolvedValue(undefined);
    renderLogin({ status: "mfa-required", confirmMfaCode });

    for (let i = 1; i <= 6; i++) {
      await user.type(screen.getByLabelText(`Kod hanesi ${i}`), String(i));
    }

    expect(confirmMfaCode).toHaveBeenCalledWith("123456");
  });

  it("shows an error message when signIn rejects", async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValueOnce(new Error("Incorrect username or password."));
    renderLogin();

    await user.type(screen.getByPlaceholderText("E-posta"), "admin@example.com");
    await user.type(screen.getByPlaceholderText("Şifre"), "wrong");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    // The raw Cognito error is translated to Turkish for display — see cognitoErrors.ts.
    expect(await screen.findByText("E-posta veya şifre hatalı.")).toBeInTheDocument();
  });
});
