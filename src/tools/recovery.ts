import { type MCPServer, object } from "mcp-use/server";
import { DEFAULT_WINDOW_DAYS } from "../constants";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { Paginated, RawRecovery } from "../whoop/raw";
import { recoveryCollectionSchema } from "../whoop/schemas";
import { toRecovery } from "../whoop/transform";
import { listInput, resolveLimit, resolveRange } from "./shared";

export function registerRecovery<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_recovery",
      title: "WHOOP recovery history",
      description:
        "Recovery history: recovery %, HRV (ms), resting HR, SpO2, skin temp. Defaults to the last 7 days; pass start/end for a specific range.",
      schema: listInput,
      outputSchema: recoveryCollectionSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const range = resolveRange(p, DEFAULT_WINDOW_DAYS);
      const data = await whoopFetch<Paginated<RawRecovery>>(
        token,
        "/v2/recovery",
        {
          start: range.start,
          end: range.end,
          limit: resolveLimit(p),
        },
      );
      return object({ records: (data.records ?? []).map(toRecovery) });
    },
  );
}
