import { WHOOP_API_BASE } from "../constants";

export class WhoopError extends Error {
  constructor(
    public status: number,
    public body: string,
    message: string,
  ) {
    super(message);
    this.name = "WhoopError";
  }
}

export async function whoopFetch<T>(
  token: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${WHOOP_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new WhoopError(
      res.status,
      body,
      `WHOOP ${res.status} on ${path}: ${body.slice(0, 300)}`,
    );
  }
  return (await res.json()) as T;
}
