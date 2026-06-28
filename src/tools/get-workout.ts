import { type MCPServer, object } from "mcp-use/server";
import { z } from "zod";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { RawWorkout } from "../whoop/raw";
import { workoutSchema } from "../whoop/schemas";
import { toWorkout } from "../whoop/transform";

export function registerGetWorkout<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_get_workout",
      title: "WHOOP workout by id",
      description:
        "Fetch one workout by its UUID (from whoop_workouts records).",
      schema: z.object({
        workout_id: z.uuid().describe("WHOOP workout UUID."),
      }),
      outputSchema: workoutSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const raw = await whoopFetch<RawWorkout>(
        token,
        `/v2/activity/workout/${p.workout_id}`,
      );
      return object(toWorkout(raw));
    },
  );
}
