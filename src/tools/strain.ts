import { type MCPServer, object } from "mcp-use/server";
import { DEFAULT_WINDOW_DAYS } from "../constants";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { Paginated, RawCycle } from "../whoop/raw";
import { strainCollectionSchema } from "../whoop/schemas";
import { toStrain } from "../whoop/transform";
import { listInput, resolveLimit, resolveRange } from "./shared";

export function registerStrain<H extends boolean>(server: MCPServer<H>): void {
  server.tool(
    {
      name: "whoop_strain",
      title: "WHOOP strain history",
      description:
        "Daily strain history (physiological cycles): day strain 0-21, average/max HR, calories. Defaults to the last 7 days; pass start/end for a specific range.",
      schema: listInput,
      outputSchema: strainCollectionSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const range = resolveRange(p, DEFAULT_WINDOW_DAYS);
      const data = await whoopFetch<Paginated<RawCycle>>(token, "/v2/cycle", {
        start: range.start,
        end: range.end,
        limit: resolveLimit(p),
      });
      return object({ records: (data.records ?? []).map(toStrain) });
    },
  );
}
