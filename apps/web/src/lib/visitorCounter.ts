const VISITOR_COUNTER_URL = "https://tpa2t5f3xuqe3gpf6olkdlfxdm0hzcpu.lambda-url.us-east-1.on.aws/";

let pending: Promise<number> | null = null;

// The counter Lambda increments on every call, so fetch once per page load: moving between the
// home page and publication pages (client-side navigation, each mounting a Footer) must not count
// as extra visits. A failed request isn't cached, so a later mount can retry.
export function fetchVisitorCount(): Promise<number> {
  pending ??= fetch(VISITOR_COUNTER_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Visitor counter request failed: ${response.status}`);
      return response.json() as Promise<number>;
    })
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });
  return pending;
}
