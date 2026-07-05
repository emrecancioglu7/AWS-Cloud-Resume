import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useAuth } from "../../auth/AuthContext";
import { focusRing } from "../../styles/focusRing";

const MFA_ISSUER = "EmreCancioglu-Admin";

const inputClass = `w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3.5 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) ${focusRing}`;
const buttonClass =
  "w-full rounded-lg bg-(--color-accent) px-3.5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50";

export function AdminLogin() {
  const { status, email, mfaSetupSecret, signIn, completeNewPassword, confirmMfaSetup, confirmMfaCode } = useAuth();
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed-in") navigate("/admin", { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (!mfaSetupSecret || !email) {
      setQrDataUrl(null);
      return;
    }
    const uri = `otpauth://totp/${encodeURIComponent(MFA_ISSUER)}:${encodeURIComponent(email)}?secret=${mfaSetupSecret}&issuer=${encodeURIComponent(MFA_ISSUER)}`;
    QRCode.toDataURL(uri).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [mfaSetupSecret, email]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti, tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  function handleSignIn(e: FormEvent) {
    e.preventDefault();
    run(() => signIn(emailInput, password));
  }

  function handleNewPassword(e: FormEvent) {
    e.preventDefault();
    run(() => completeNewPassword(newPassword));
  }

  function handleMfaSetup(e: FormEvent) {
    e.preventDefault();
    run(() => confirmMfaSetup(totpCode));
  }

  function handleMfaCode(e: FormEvent) {
    e.preventDefault();
    run(() => confirmMfaCode(totpCode));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg) px-6">
      <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-surface) p-8">
        <h1 className="mb-6 text-center font-heading text-xl font-semibold text-(--color-text)">Admin Girişi</h1>

        {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {status === "loading" && <p className="text-center text-sm text-(--color-text-muted)">Yükleniyor...</p>}

        {status === "signed-out" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="E-posta"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              Giriş yap
            </button>
          </form>
        )}

        {status === "new-password-required" && (
          <form onSubmit={handleNewPassword} className="flex flex-col gap-4">
            <p className="text-sm text-(--color-text-muted)">İlk girişiniz — kalıcı bir şifre belirleyin.</p>
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              placeholder="Yeni şifre (en az 12 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              Şifreyi belirle
            </button>
          </form>
        )}

        {status === "mfa-setup" && (
          <form onSubmit={handleMfaSetup} className="flex flex-col gap-4">
            <p className="text-sm text-(--color-text-muted)">
              Authenticator uygulamanızla (Google Authenticator, 1Password, vb.) aşağıdaki kodu tarayın, sonra üretilen 6 haneli kodu girin.
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="TOTP QR kodu" className="mx-auto h-40 w-40 rounded-lg bg-white p-2" />}
            {mfaSetupSecret && <p className="break-all text-center text-xs text-(--color-text-muted)">Manuel kod: {mfaSetupSecret}</p>}
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="6 haneli kod"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              Doğrula
            </button>
          </form>
        )}

        {status === "mfa-required" && (
          <form onSubmit={handleMfaCode} className="flex flex-col gap-4">
            <p className="text-sm text-(--color-text-muted)">Authenticator uygulamanızdaki 6 haneli kodu girin.</p>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="6 haneli kod"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={buttonClass}>
              Doğrula
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
