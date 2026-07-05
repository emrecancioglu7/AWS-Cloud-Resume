const VISITOR_COUNTER_URL = "https://tpa2t5f3xuqe3gpf6olkdlfxdm0hzcpu.lambda-url.us-east-1.on.aws/";

export async function fetchVisitorCount(): Promise<number> {
  const response = await fetch(VISITOR_COUNTER_URL);
  if (!response.ok) throw new Error(`Visitor counter request failed: ${response.status}`);
  return response.json();
}
