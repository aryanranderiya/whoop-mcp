# WHOOP MCP

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives LLM agents read-only access to your [WHOOP](https://www.whoop.com) data — recovery, sleep, strain, workouts, and profile.

Built on [`mcp-use`](https://docs.mcp-use.com). Hosted at **`https://whoop.aryanranderiya.com/mcp`**.

It is **not** a 1:1 wrapper of the WHOOP REST API. Following ["stop converting REST APIs to MCP"](https://jlowin.dev/blog/stop-converting-rest-apis-to-mcp), tools are curated for agents: one major context tool, token-efficient trimmed responses, unit-converted values (minutes/hours, kcal), and strict input/output schemas — so the model spends fewer round trips and less context.

## Tools

| Tool | What it returns |
| --- | --- |
| `whoop_overview` | **Start here.** One-call snapshot: latest recovery, last sleep, current day strain, profile + body. |
| `whoop_recovery` | Recovery history (recovery %, HRV ms, resting HR, SpO2, skin temp). Default last 7 days. |
| `whoop_sleep` | Sleep history (performance/efficiency/consistency %, hours slept, stage minutes, respiratory rate, sleep need). Default last 7 days. |
| `whoop_strain` | Daily strain history (strain 0-21, avg/max HR, kcal). Default last 7 days. |
| `whoop_workouts` | Workout history (sport, strain, avg/max HR, kcal, duration, distance, HR-zone minutes). Default last 14 days. |
| `whoop_profile` | Profile + body measurements (name, email, height, weight, max HR). |
| `whoop_get_cycle` | One cycle by id, with its recovery and sleep for full day context. |
| `whoop_get_sleep` | One sleep activity by UUID. |
| `whoop_get_workout` | One workout by UUID. |

History tools accept `days` (lookback window) or explicit `start`/`end` ISO-8601 dates, plus an optional `limit` (max 25). Internal pagination is hidden.

## Authentication

WHOOP uses OAuth 2.0 but does not support Dynamic Client Registration, PKCE-S256 advertisement, or resource indicators — all of which spec-compliant MCP clients require. This server bridges that gap with `mcp-use`'s `oauthProxy`: it advertises a compliant authorization server (DCR + S256 + protected-resource metadata) and proxies the PKCE flow through to WHOOP's real OAuth. WHOOP issues opaque tokens, so a custom `verifyToken` validates them against `GET /v2/user/profile/basic` (cached briefly).

The client connects to `/mcp`, completes WHOOP consent, and each tool call uses that user's WHOOP access token (`ctx.auth.accessToken`). The proxy is stateless — no token store required.

## WHOOP app setup

In the [WHOOP developer dashboard](https://developer.whoop.com):

- **Redirect URI:** `https://whoop.aryanranderiya.com/oauth/callback` (add `http://localhost:3000/oauth/callback` too for local OAuth testing).
- **Scopes:** `read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline`.
- **Webhook URL:** not used — leave blank.

## Environment

Copy `.env.example` to `.env`:

```
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
MCP_URL=https://whoop.aryanranderiya.com   # local: http://localhost:3000
```

`MCP_URL` sets the OAuth `redirect_uri` (`<MCP_URL>/oauth/callback`).

## Develop

```bash
npm install
npm run dev        # boots on http://localhost:3000, inspector at /inspector
npm test           # transform-layer unit tests
npm run typecheck  # tsc --noEmit (strict)
```

## Deploy (Manufact Cloud)

```bash
npx @mcp-use/cli login
npm run deploy -- --env-file .env
```

Then attach the custom domain `whoop.aryanranderiya.com` in the Manufact dashboard (CNAME → `deploy.run.mcp-use.com`) and set `MCP_URL=https://whoop.aryanranderiya.com`.

## Connect from a client

Add the server URL `https://whoop.aryanranderiya.com/mcp` as a custom MCP server, complete the WHOOP OAuth consent, then ask the agent for your WHOOP status.

## License

MIT
