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

// The origin clients actually reach. Manufact manages MCP_URL itself, and a
// slug change silently moves it, so the OAuth base URL gets its own variable
// that only changes when the public hostname does.
const baseUrl = (
  process.env.PUBLIC_URL ||
  process.env.MCP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

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

// mcp-use serves bundled assets under /mcp-use/public/. Expose the WHOOP icon
// at the standard root paths too, so external favicon resolvers (e.g. GAIA,
// which fetches /favicon.ico and parses <link rel="icon"> from the host root)
// can discover it.
server.app.get("/favicon.ico", (c) =>
  c.redirect("/mcp-use/public/favicon.ico", 302),
);
server.app.get("/", (c) =>
  c.html(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
      `<title>WHOOP MCP</title>` +
      `<link rel="icon" href="/mcp-use/public/favicon.ico" sizes="any"/>` +
      `<link rel="icon" type="image/png" href="/mcp-use/public/favicon.png"/>` +
      `<link rel="apple-touch-icon" href="/mcp-use/public/apple-touch-icon.png"/>` +
      `<meta name="description" content="WHOOP MCP server"/></head>` +
      `<body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem">` +
      `<h1>WHOOP MCP</h1><p>Model Context Protocol server for WHOOP. Connect a client to <code>${baseUrl}/mcp</code>.</p>` +
      `</body></html>`,
  ),
);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
// Printed at boot because every OAuth discovery URL is derived from it: if this
// host does not resolve back to this deployment, clients get 401 forever.
console.log(`WHOOP MCP server running on port ${PORT}`);
console.log(`WHOOP MCP public URL: ${baseUrl}`);
console.log(`WHOOP MCP OAuth redirect_uri: ${baseUrl}/oauth/callback`);
server.listen(PORT);
