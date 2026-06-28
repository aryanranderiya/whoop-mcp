import { type MCPServer, object } from "mcp-use/server";
import { z } from "zod";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { RawSleep } from "../whoop/raw";
import { sleepSchema } from "../whoop/schemas";
import { toSleep } from "../whoop/transform";

export function registerGetSleep<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_get_sleep",
      title: "WHOOP sleep by id",
      description:
        "Fetch one sleep activity by its UUID (from whoop_sleep records).",
      schema: z.object({
        sleep_id: z.uuid().describe("WHOOP sleep UUID."),
      }),
      outputSchema: sleepSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const raw = await whoopFetch<RawSleep>(
        token,
        `/v2/activity/sleep/${p.sleep_id}`,
      );
      return object(toSleep(raw));
    },
  );
}
