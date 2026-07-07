// Cognito's SDK surfaces raw English exception messages — translate the common ones so the
// login screen doesn't leak untranslated text. Falls back to the original message if unknown.
const KNOWN_MESSAGES: Record<string, string> = {
  "Incorrect username or password.": "E-posta veya şifre hatalı.",
  "User does not exist.": "Bu e-posta ile bir kullanıcı bulunamadı.",
  "Password does not conform to policy: Password not long enough": "Şifre en az 12 karakter olmalı.",
  "Password does not conform to policy: Password must have uppercase characters": "Şifre en az bir büyük harf içermeli.",
  "Password does not conform to policy: Password must have lowercase characters": "Şifre en az bir küçük harf içermeli.",
  "Password does not conform to policy: Password must have numeric characters": "Şifre en az bir rakam içermeli.",
  "Password does not conform to policy: Password must have symbol characters": "Şifre en az bir sembol içermeli.",
  "Invalid session for the user, session is expired.": "Oturum süresi doldu, sayfayı yenileyip tekrar giriş yapın.",
  "Invalid code received for user": "Kod hatalı, tekrar deneyin.",
  "Invalid verification code provided, please try again.": "Kod hatalı, tekrar deneyin.",
  "Code mismatch and max attempts exceeded, please try after some time.": "Çok fazla hatalı deneme yapıldı, biraz sonra tekrar deneyin.",
};

export function translateAuthError(message: string): string {
  if (KNOWN_MESSAGES[message]) return KNOWN_MESSAGES[message];
  const match = Object.entries(KNOWN_MESSAGES).find(([key]) => message.includes(key));
  return match ? match[1] : message;
}
