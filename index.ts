import { MCPServer, oauthProxy } from "mcp-use/server";
import {
  WHOOP_AUTH_ENDPOINT,
  WHOOP_SCOPES,
  WHOOP_TOKEN_ENDPOINT,
} from "./src/constants";
import { registerTools } from "./src/tools";
import { verifyWhoopToken, whoopGetUserInfo } from "./src/whoop/auth";

const clientId = process.env.WHOOP_CLIENT_ID;
const clientSecret = process.env.WHOOP_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error("WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set");
}

const baseUrl = process.env.MCP_URL || "http://localhost:3000";

const server = new MCPServer({
  name: "whoop-mcp",
  title: "WHOOP",
  version: "1.0.0",
  description:
    "Read-only access to your WHOOP recovery, sleep, strain, workouts, and profile.",
  instructions:
    "Call whoop_overview first for a quick snapshot (latest recovery, last sleep, day strain, profile). " +
    "Use whoop_recovery / whoop_sleep / whoop_strain / whoop_workouts for history over a window (default last 7-14 days; pass start/end ISO dates for a specific range). " +
    "Use whoop_get_cycle / whoop_get_sleep / whoop_get_workout to drill into a specific record by id (ids come from the history tools). " +
    "All durations are returned in minutes/hours and energy in kcal. Every tool is read-only.",
  baseUrl,
  favicon: "favicon.ico",
  websiteUrl: baseUrl,
  icons: [
    {
      src: "favicon.png",
      mimeType: "image/png",
      sizes: ["256x256"],
    },
  ],
  oauth: oauthProxy({
    authEndpoint: WHOOP_AUTH_ENDPOINT,
    tokenEndpoint: WHOOP_TOKEN_ENDPOINT,
    issuer: baseUrl,
    clientId,
    clientSecret,
    scopes: [...WHOOP_SCOPES],
    verifyToken: verifyWhoopToken,
    getUserInfo: whoopGetUserInfo,
  }),
});

registerTools(server);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
console.log(`WHOOP MCP server running on port ${PORT}`);
server.listen(PORT);
