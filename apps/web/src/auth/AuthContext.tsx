import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AuthenticationDetails, CognitoUser, type CognitoUserSession } from "amazon-cognito-identity-js";
import { userPool } from "./cognitoConfig";

type AuthStatus = "loading" | "signed-out" | "new-password-required" | "mfa-setup" | "mfa-required" | "signed-in";

interface AuthContextValue {
  status: AuthStatus;
  idToken: string | null;
  email: string | null;
  mfaSetupSecret: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  confirmMfaSetup: (totpCode: string) => Promise<void>;
  confirmMfaCode: (totpCode: string) => Promise<void>;
  signOut: () => void;
  // Returns a guaranteed-fresh ID token, silently using the refresh token if the cached one has
  // expired (Cognito ID/access tokens are only valid for 1 hour — see cognito.tf). Use this for
  // API calls instead of the static `idToken` field above, which is only a snapshot from the
  // last sign-in/render and goes stale after an hour.
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [mfaSetupSecret, setMfaSetupSecret] = useState<string | null>(null);
  // The Cognito challenge continuation methods (completeNewPasswordChallenge, verifySoftwareToken,
  // sendMFACode) must be called on the SAME CognitoUser instance that received the challenge.
  const pendingUser = useRef<CognitoUser | null>(null);

  useEffect(() => {
    const current = userPool.getCurrentUser();
    if (!current) {
      setStatus("signed-out");
      return;
    }
    current.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setStatus("signed-out");
        return;
      }
      setIdToken(session.getIdToken().getJwtToken());
      setEmail(current.getUsername());
      setStatus("signed-in");
    });
  }, []);

  function signIn(usernameInput: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      const user = new CognitoUser({ Username: usernameInput, Pool: userPool });
      pendingUser.current = user;

      user.authenticateUser(new AuthenticationDetails({ Username: usernameInput, Password: password }), {
        onSuccess: (session) => {
          setIdToken(session.getIdToken().getJwtToken());
          setEmail(usernameInput);
          setStatus("signed-in");
          resolve();
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: () => {
          setEmail(usernameInput);
          setStatus("new-password-required");
          resolve();
        },
        totpRequired: () => {
          setEmail(usernameInput);
          setStatus("mfa-required");
          resolve();
        },
        mfaSetup: () => {
          setEmail(usernameInput);
          user.associateSoftwareToken({
            associateSecretCode: (secretCode) => {
              setMfaSetupSecret(secretCode);
              setStatus("mfa-setup");
              resolve();
            },
            onFailure: (err) => reject(err),
          });
        },
      });
    });
  }

  function completeNewPassword(newPassword: string) {
    return new Promise<void>((resolve, reject) => {
      const user = pendingUser.current;
      if (!user) return reject(new Error("Oturum bulunamadı, tekrar giriş yapın."));

      user.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: (session) => {
            setIdToken(session.getIdToken().getJwtToken());
            setStatus("signed-in");
            resolve();
          },
          onFailure: (err) => reject(err),
          mfaSetup: () => {
            user.associateSoftwareToken({
              associateSecretCode: (secretCode) => {
                setMfaSetupSecret(secretCode);
                setStatus("mfa-setup");
                resolve();
              },
              onFailure: (err) => reject(err),
            });
          },
        },
      );
    });
  }

  function confirmMfaSetup(totpCode: string) {
    return new Promise<void>((resolve, reject) => {
      const user = pendingUser.current;
      if (!user) return reject(new Error("Oturum bulunamadı, tekrar giriş yapın."));

      user.verifySoftwareToken(totpCode, "Admin cihazı", {
        onSuccess: (session) => {
          setIdToken(session.getIdToken().getJwtToken());
          setMfaSetupSecret(null);
          setStatus("signed-in");
          resolve();
        },
        onFailure: (err) => reject(err),
      });
    });
  }

  function confirmMfaCode(totpCode: string) {
    return new Promise<void>((resolve, reject) => {
      const user = pendingUser.current;
      if (!user) return reject(new Error("Oturum bulunamadı, tekrar giriş yapın."));

      user.sendMFACode(
        totpCode,
        {
          onSuccess: (session) => {
            setIdToken(session.getIdToken().getJwtToken());
            setStatus("signed-in");
            resolve();
          },
          onFailure: (err) => reject(err),
        },
        "SOFTWARE_TOKEN_MFA",
      );
    });
  }

  function signOut() {
    userPool.getCurrentUser()?.signOut();
    pendingUser.current = null;
    setIdToken(null);
    setEmail(null);
    setMfaSetupSecret(null);
    setStatus("signed-out");
  }

  function getIdToken() {
    return new Promise<string>((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) return reject(new Error("Oturum yok, tekrar giriş yapın."));

      user.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) return reject(err ?? new Error("Oturum geçersiz, tekrar giriş yapın."));
        resolve(session.getIdToken().getJwtToken());
      });
    });
  }

  return (
    <AuthContext.Provider
      value={{ status, idToken, email, mfaSetupSecret, signIn, completeNewPassword, confirmMfaSetup, confirmMfaCode, signOut, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
