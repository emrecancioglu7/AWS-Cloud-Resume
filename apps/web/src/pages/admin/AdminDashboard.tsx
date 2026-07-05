import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { API_BASE_URL } from "../../auth/cognitoConfig";
import { focusRing } from "../../styles/focusRing";

interface FundItem {
  pk: string;
  sk: string;
  [key: string]: unknown;
}

export function AdminDashboard() {
  const { email, idToken, signOut } = useAuth();
  const [funds, setFunds] = useState<FundItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    fetch(`${API_BASE_URL}/portfolio`, { headers: { Authorization: `Bearer ${idToken}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`İstek başarısız oldu (${res.status})`);
        return res.json();
      })
      .then((data: { funds: FundItem[] }) => {
        if (!cancelled) setFunds(data.funds);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [idToken]);

  return (
    <div className="min-h-screen bg-(--color-bg) px-6 py-10 text-(--color-text)">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-semibold">Portföy</h1>
            <p className="text-sm text-(--color-text-muted)">{email}</p>
          </div>
          <button
            onClick={signOut}
            className={`rounded-lg border border-(--color-border) px-3.5 py-2 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text) ${focusRing}`}
          >
            Çıkış yap
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        {!error && funds === null && <p className="text-sm text-(--color-text-muted)">Yükleniyor...</p>}

        {funds !== null && funds.length === 0 && (
          <p className="rounded-xl border border-dashed border-(--color-border) px-6 py-10 text-center text-sm text-(--color-text-muted)">
            Henüz fon verisi yok — TEFAS scraper eklendiğinde burada listelenecek.
          </p>
        )}

        {funds !== null && funds.length > 0 && (
          <ul className="flex flex-col gap-2">
            {funds.map((fund) => (
              <li key={fund.pk + fund.sk} className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm">
                <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(fund, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
