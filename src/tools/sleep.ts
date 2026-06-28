import { type MCPServer, object } from "mcp-use/server";
import { DEFAULT_WINDOW_DAYS } from "../constants";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { Paginated, RawSleep } from "../whoop/raw";
import { sleepCollectionSchema } from "../whoop/schemas";
import { toSleep } from "../whoop/transform";
import { listInput, resolveLimit, resolveRange } from "./shared";

export function registerSleep<H extends boolean>(server: MCPServer<H>): void {
  server.tool(
    {
      name: "whoop_sleep",
      title: "WHOOP sleep history",
      description:
        "Sleep history: performance/efficiency/consistency %, hours slept, stage breakdown (minutes), respiratory rate, sleep need. Defaults to the last 7 days; pass start/end for a specific range.",
      schema: listInput,
      outputSchema: sleepCollectionSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const range = resolveRange(p, DEFAULT_WINDOW_DAYS);
      const data = await whoopFetch<Paginated<RawSleep>>(
        token,
        "/v2/activity/sleep",
        {
          start: range.start,
          end: range.end,
          limit: resolveLimit(p),
        },
      );
      return object({ records: (data.records ?? []).map(toSleep) });
    },
  );
}
