import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Info, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../../auth/AuthContext";
import { focusRing } from "../../styles/focusRing";
import { translateAuthError } from "./cognitoErrors";
import { OtpInput } from "./OtpInput";
import { Tooltip } from "./Tooltip";
import { passwordStrength, passwordStrengthColors, passwordStrengthLabels } from "./passwordStrength";
import { IconField, SubmitButton, inputClass } from "./formFields";

const MFA_ISSUER = "EmreCancioglu-Admin";

const stageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const passwordInputClass = `${inputClass} pr-10`;

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  autoFocus,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--color-text-muted)">
        <Lock size={16} />
      </span>
      <input
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={passwordInputClass}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-3 flex items-center text-(--color-text-muted) hover:text-(--color-text)"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const strength = passwordStrength(password);
  const bars = strength === "strong" ? 3 : strength === "medium" ? 2 : 1;
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < bars ? passwordStrengthColors[strength] : "bg-(--color-border)"}`}
          />
        ))}
      </div>
      <span className="text-xs text-(--color-text-muted)">{passwordStrengthLabels[strength]}</span>
    </div>
  );
}

export function AdminLogin() {
  const { status, email, mfaSetupSecret, signIn, completeNewPassword, confirmMfaSetup, confirmMfaCode } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

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
      setError(translateAuthError(err instanceof Error ? err.message : "Bir şeyler ters gitti, tekrar deneyin."));
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

  function submitMfaSetup(code: string) {
    run(() => confirmMfaSetup(code));
  }

  function submitMfaCode(code: string) {
    run(() => confirmMfaCode(code));
  }

  const subtitle =
    status === "new-password-required"
      ? "İlk girişiniz — kalıcı bir şifre belirleyin."
      : status === "mfa-setup"
        ? "İki adımlı doğrulamayı kurun."
        : status === "mfa-required"
          ? "İki adımlı doğrulama kodunuzu girin."
          : "Portföyünüzü yönetmek için giriş yapın.";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-bg) px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(600px circle at 50% 35%, var(--color-accent-soft), transparent 70%)" }}
      />

      <Link
        to="/"
        className={`absolute left-6 top-6 flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text) ${focusRing}`}
      >
        <ArrowLeft size={16} /> Siteye dön
      </Link>

      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-surface) p-8 shadow-xl shadow-black/10"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-(--color-accent-soft) text-sm font-bold text-(--color-accent)">
            EÇ
          </span>
          <h1 className="font-heading text-xl font-semibold text-(--color-text)">Admin Panel</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">{subtitle}</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-center gap-2 overflow-hidden rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              <AlertCircle size={16} className="shrink-0" /> {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div key="loading" {...stageVariants} className="flex min-h-40 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-(--color-text-muted)" />
            </motion.div>
          )}

          {status === "signed-out" && (
            <motion.form key="signed-out" {...stageVariants} onSubmit={handleSignIn} className="flex flex-col gap-4">
              <IconField
                icon={<Mail size={16} />}
                type="email"
                required
                autoFocus
                autoComplete="username"
                placeholder="E-posta"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <PasswordField
                autoComplete="current-password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <SubmitButton busy={busy}>Giriş yap</SubmitButton>
            </motion.form>
          )}

          {status === "new-password-required" && (
            <motion.form key="new-password" {...stageVariants} onSubmit={handleNewPassword} className="flex flex-col gap-2">
              <PasswordField
                autoFocus
                minLength={12}
                autoComplete="new-password"
                placeholder="Yeni şifre (en az 12 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordStrengthMeter password={newPassword} />
              <SubmitButton busy={busy} className="mt-2">
                Şifreyi belirle
              </SubmitButton>
            </motion.form>
          )}

          {status === "mfa-setup" && (
            <motion.form key="mfa-setup" {...stageVariants} onSubmit={handleMfaSetup} className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5 text-sm text-(--color-text-muted)">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-xs font-semibold text-(--color-accent)">
                  1
                </span>
                <p>Authenticator uygulamanızla (Google Authenticator, 1Password, vb.) aşağıdaki QR kodu tarayın.</p>
              </div>

              {qrDataUrl && (
                <img src={qrDataUrl} alt="TOTP QR kodu" className="mx-auto h-40 w-40 rounded-lg border border-(--color-border) bg-white p-2" />
              )}
              {mfaSetupSecret && (
                <div className="flex items-center justify-center gap-1.5">
                  <p className="break-all rounded-lg bg-(--color-bg) px-3 py-2 text-center font-mono text-xs text-(--color-text-muted)">
                    {mfaSetupSecret}
                  </p>
                  <Tooltip label="QR kodu tarayamıyorsanız bu kodu authenticator uygulamanıza manuel olarak girebilirsiniz.">
                    <Info size={14} className="shrink-0 text-(--color-text-muted)" />
                  </Tooltip>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-sm text-(--color-text-muted)">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-xs font-semibold text-(--color-accent)">
                  2
                </span>
                <p>Uygulamanın ürettiği 6 haneli kodu girin.</p>
              </div>
              <OtpInput value={totpCode} onChange={setTotpCode} onComplete={submitMfaSetup} autoFocus disabled={busy} />
              <SubmitButton busy={busy}>Doğrula</SubmitButton>
            </motion.form>
          )}

          {status === "mfa-required" && (
            <motion.form key="mfa-required" {...stageVariants} onSubmit={handleMfaCode} className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 text-(--color-text-muted)">
                <ShieldCheck size={16} />
                <p className="text-sm">Authenticator uygulamanızdaki 6 haneli kodu girin.</p>
              </div>
              <OtpInput value={totpCode} onChange={setTotpCode} onComplete={submitMfaCode} autoFocus disabled={busy} />
              <SubmitButton busy={busy}>Doğrula</SubmitButton>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
