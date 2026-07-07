export type PasswordStrength = "weak" | "medium" | "strong";

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

export const passwordStrengthLabels: Record<PasswordStrength, string> = {
  weak: "Zayıf",
  medium: "Orta",
  strong: "Güçlü",
};

export const passwordStrengthColors: Record<PasswordStrength, string> = {
  weak: "bg-red-400",
  medium: "bg-amber-400",
  strong: "bg-(--color-accent)",
};
