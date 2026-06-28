export const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
export const WHOOP_AUTH_ENDPOINT =
  "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_ENDPOINT =
  "https://api.prod.whoop.com/oauth/oauth2/token";

export const WHOOP_SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline",
] as const;

export const KJ_TO_KCAL = 0.239006;

export const DEFAULT_WINDOW_DAYS = 7;
export const DEFAULT_WORKOUT_DAYS = 14;
export const WORKOUT_DEFAULT_LIMIT = 10;
export const HISTORY_DEFAULT_LIMIT = 10;
export const MAX_PAGE_LIMIT = 25;

export const TOKEN_CACHE_TTL_MS = 60_000;
