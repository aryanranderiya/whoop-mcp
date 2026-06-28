import { type MCPServer, object } from "mcp-use/server";
import { z } from "zod";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { RawCycle, RawRecovery, RawSleep } from "../whoop/raw";
import { type CycleDetailOut, cycleDetailSchema } from "../whoop/schemas";
import { toRecovery, toSleep, toStrain } from "../whoop/transform";

export function registerGetCycle<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_get_cycle",
      title: "WHOOP cycle by id",
      description:
        "Fetch one physiological cycle by id (from whoop_strain records), including its recovery and sleep for full day context.",
      schema: z.object({
        cycle_id: z.number().int().describe("WHOOP cycle id (int64)."),
      }),
      outputSchema: cycleDetailSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      // A cycle may legitimately have no recovery/sleep yet (404); those are
      // optional context, so they fall back to null. The cycle fetch itself is
      // not caught — a real auth/network failure still propagates loud.
      const [cycle, recovery, sleep] = await Promise.all([
        whoopFetch<RawCycle>(token, `/v2/cycle/${p.cycle_id}`),
        whoopFetch<RawRecovery>(
          token,
          `/v2/cycle/${p.cycle_id}/recovery`,
        ).catch(() => null),
        whoopFetch<RawSleep>(token, `/v2/cycle/${p.cycle_id}/sleep`).catch(
          () => null,
        ),
      ]);
      const out: CycleDetailOut = {
        cycle: toStrain(cycle),
        recovery: recovery ? toRecovery(recovery) : null,
        sleep: sleep ? toSleep(sleep) : null,
      };
      return object(out);
    },
  );
}
