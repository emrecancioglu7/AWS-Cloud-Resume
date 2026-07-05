import { API_BASE_URL } from "./cognitoConfig";

export async function apiFetch<T>(getIdToken: () => Promise<string>, path: string, init?: RequestInit): Promise<T> {
  const idToken = await getIdToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${idToken}`, "content-type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string });
    throw new Error(body.message || `İstek başarısız oldu (${res.status})`);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}
