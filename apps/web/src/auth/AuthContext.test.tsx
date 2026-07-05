import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const { mockUser, mockUserPool } = vi.hoisted(() => {
  const mockUser = {
    authenticateUser: vi.fn(),
    completeNewPasswordChallenge: vi.fn(),
    associateSoftwareToken: vi.fn(),
    verifySoftwareToken: vi.fn(),
    sendMFACode: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    getUsername: vi.fn(() => "admin@example.com"),
  };
  const mockUserPool = { getCurrentUser: vi.fn((): typeof mockUser | null => null) };
  return { mockUser, mockUserPool };
});

// Regular `function` (not an arrow function) so it can be used as a constructor — `new Fn()`
// uses whatever object a constructor function explicitly returns instead of a fresh `this`.
vi.mock("amazon-cognito-identity-js", () => ({
  CognitoUserPool: vi.fn(function () {
    return mockUserPool;
  }),
  CognitoUser: vi.fn(function () {
    return mockUser;
  }),
  AuthenticationDetails: vi.fn(function (data) {
    return data;
  }),
}));

const { AuthProvider, useAuth } = await import("./AuthContext");

function fakeSession(token = "fake-id-token") {
  return { isValid: () => true, getIdToken: () => ({ getJwtToken: () => token }) };
}

describe("AuthContext", () => {
  beforeEach(() => {
    mockUserPool.getCurrentUser.mockReset().mockReturnValue(null);
    mockUser.authenticateUser.mockReset();
    mockUser.completeNewPasswordChallenge.mockReset();
    mockUser.associateSoftwareToken.mockReset();
    mockUser.verifySoftwareToken.mockReset();
    mockUser.sendMFACode.mockReset();
    mockUser.getSession.mockReset();
    mockUser.signOut.mockReset();
    mockUser.getUsername.mockReset().mockReturnValue("admin@example.com");
  });

  it("starts signed-out when nothing is stored", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
  });

  it("restores a signed-in session on mount when one is stored and valid", async () => {
    mockUserPool.getCurrentUser.mockReturnValue(mockUser);
    mockUser.getSession.mockImplementation((cb: (err: unknown, session: unknown) => void) => cb(null, fakeSession()));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.status).toBe("signed-in"));
    expect(result.current.idToken).toBe("fake-id-token");
    expect(result.current.email).toBe("admin@example.com");
  });

  it("falls back to signed-out when the stored session is invalid", async () => {
    mockUserPool.getCurrentUser.mockReturnValue(mockUser);
    mockUser.getSession.mockImplementation((cb: (err: unknown, session: unknown) => void) => cb(new Error("expired"), null));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
  });

  it("signIn onSuccess signs the user in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { onSuccess: (s: unknown) => void }) =>
      callbacks.onSuccess(fakeSession("token-1")),
    );
    await act(() => result.current.signIn("admin@example.com", "password"));

    expect(result.current.status).toBe("signed-in");
    expect(result.current.idToken).toBe("token-1");
  });

  it("signIn newPasswordRequired asks for a new password", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { newPasswordRequired: () => void }) =>
      callbacks.newPasswordRequired(),
    );
    await act(() => result.current.signIn("admin@example.com", "temp-password"));

    expect(result.current.status).toBe("new-password-required");
  });

  it("signIn totpRequired asks for the MFA code", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { totpRequired: () => void }) => callbacks.totpRequired());
    await act(() => result.current.signIn("admin@example.com", "password"));

    expect(result.current.status).toBe("mfa-required");
  });

  it("signIn mfaSetup associates a software token and exposes the secret", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { mfaSetup: () => void }) => callbacks.mfaSetup());
    mockUser.associateSoftwareToken.mockImplementation((callbacks: { associateSecretCode: (s: string) => void }) =>
      callbacks.associateSecretCode("SECRET123"),
    );
    await act(() => result.current.signIn("admin@example.com", "password"));

    expect(result.current.status).toBe("mfa-setup");
    expect(result.current.mfaSetupSecret).toBe("SECRET123");
  });

  it("signIn onFailure rejects", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { onFailure: (e: Error) => void }) =>
      callbacks.onFailure(new Error("Incorrect username or password.")),
    );

    await expect(result.current.signIn("admin@example.com", "wrong")).rejects.toThrow("Incorrect username or password.");
  });

  it("completeNewPassword resolves the challenge and signs in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { newPasswordRequired: () => void }) =>
      callbacks.newPasswordRequired(),
    );
    await act(() => result.current.signIn("a@b.com", "temp"));

    mockUser.completeNewPasswordChallenge.mockImplementation(
      (_pw: string, _attrs: unknown, callbacks: { onSuccess: (s: unknown) => void }) => callbacks.onSuccess(fakeSession("token-2")),
    );
    await act(() => result.current.completeNewPassword("NewPassword123!"));

    expect(result.current.status).toBe("signed-in");
    expect(result.current.idToken).toBe("token-2");
  });

  it("completeNewPassword rejects when called with no pending user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    await expect(result.current.completeNewPassword("whatever")).rejects.toThrow();
  });

  it("confirmMfaSetup verifies the TOTP code and signs in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { mfaSetup: () => void }) => callbacks.mfaSetup());
    mockUser.associateSoftwareToken.mockImplementation((callbacks: { associateSecretCode: (s: string) => void }) =>
      callbacks.associateSecretCode("SECRET"),
    );
    await act(() => result.current.signIn("a@b.com", "pw"));

    mockUser.verifySoftwareToken.mockImplementation((_code: string, _name: string, callbacks: { onSuccess: (s: unknown) => void }) =>
      callbacks.onSuccess(fakeSession("token-3")),
    );
    await act(() => result.current.confirmMfaSetup("123456"));

    expect(result.current.status).toBe("signed-in");
    expect(result.current.idToken).toBe("token-3");
    expect(result.current.mfaSetupSecret).toBeNull();
  });

  it("confirmMfaCode sends the MFA code and signs in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    mockUser.authenticateUser.mockImplementation((_d: unknown, callbacks: { totpRequired: () => void }) => callbacks.totpRequired());
    await act(() => result.current.signIn("a@b.com", "pw"));

    mockUser.sendMFACode.mockImplementation((_code: string, callbacks: { onSuccess: (s: unknown) => void }) =>
      callbacks.onSuccess(fakeSession("token-4")),
    );
    await act(() => result.current.confirmMfaCode("654321"));

    expect(result.current.status).toBe("signed-in");
    expect(result.current.idToken).toBe("token-4");
  });

  it("signOut clears state and calls the underlying Cognito signOut", async () => {
    mockUserPool.getCurrentUser.mockReturnValue(mockUser);
    mockUser.getSession.mockImplementation((cb: (err: unknown, session: unknown) => void) => cb(null, fakeSession()));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-in"));

    act(() => result.current.signOut());

    expect(result.current.status).toBe("signed-out");
    expect(result.current.idToken).toBeNull();
    expect(result.current.email).toBeNull();
    expect(mockUser.signOut).toHaveBeenCalled();
  });

  it("getIdToken resolves with a fresh token when the session is valid", async () => {
    mockUserPool.getCurrentUser.mockReturnValue(mockUser);
    mockUser.getSession.mockImplementation((cb: (err: unknown, session: unknown) => void) => cb(null, fakeSession("refreshed-token")));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-in"));

    await expect(result.current.getIdToken()).resolves.toBe("refreshed-token");
  });

  it("getIdToken rejects when there is no current user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.status).toBe("signed-out"));

    await expect(result.current.getIdToken()).rejects.toThrow();
  });

  it("useAuth throws when used outside an AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
  });
});
