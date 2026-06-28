import { TOKEN_CACHE_TTL_MS } from "../constants";
import { whoopFetch } from "./client";
import type { RawProfile } from "./raw";

// WHOOP issues opaque (non-JWT) access tokens, so the built-in jwksVerifier
// cannot validate them. We verify by calling the cheapest authenticated
// endpoint and treating a 200 as proof the token is valid. Results are cached
// per-token with a short TTL so we don't spend a WHOOP request on every /mcp call.
const cache = new Map<string, { at: number; profile: RawProfile }>();

export async function verifyWhoopToken(
  token: string,
): Promise<{ payload: Record<string, unknown> }> {
  const now = Date.now();
  const hit = cache.get(token);
  if (hit && now - hit.at < TOKEN_CACHE_TTL_MS) {
    return { payload: hit.profile as unknown as Record<string, unknown> };
  }
  const profile = await whoopFetch<RawProfile>(token, "/v2/user/profile/basic");
  cache.set(token, { at: now, profile });
  return { payload: profile as unknown as Record<string, unknown> };
}

export function whoopGetUserInfo(payload: Record<string, unknown>): {
  userId: string;
  email?: string;
  name?: string;
} {
  const p = payload as Partial<RawProfile>;
  return {
    userId: p.user_id != null ? String(p.user_id) : "whoop-user",
    email: p.email,
    name: [p.first_name, p.last_name].filter(Boolean).join(" ") || undefined,
  };
}

// The tool context's `auth` is optional in the type unless OAuth inference flows
// through; guard it so a missing token fails loud rather than throwing a vague
// undefined-access error deep in a fetch.
export function requireToken(ctx: { auth?: { accessToken: string } }): string {
  const token = ctx.auth?.accessToken;
  if (!token)
    throw new Error(
      "Not authenticated: no WHOOP access token in request context",
    );
  return token;
}
