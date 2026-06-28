import { type MCPServer, object } from "mcp-use/server";
import { DEFAULT_WORKOUT_DAYS, WORKOUT_DEFAULT_LIMIT } from "../constants";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { Paginated, RawWorkout } from "../whoop/raw";
import { workoutCollectionSchema } from "../whoop/schemas";
import { toWorkout } from "../whoop/transform";
import { listInput, resolveLimit, resolveRange } from "./shared";

export function registerWorkouts<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_workouts",
      title: "WHOOP workout history",
      description:
        "Workout history: sport, strain, average/max HR, calories, duration, distance, HR-zone minutes. Defaults to the last 14 days; pass start/end for a specific range.",
      schema: listInput,
      outputSchema: workoutCollectionSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (p, ctx) => {
      const token = requireToken(ctx);
      const range = resolveRange(p, DEFAULT_WORKOUT_DAYS);
      const data = await whoopFetch<Paginated<RawWorkout>>(
        token,
        "/v2/activity/workout",
        {
          start: range.start,
          end: range.end,
          limit: resolveLimit(p, WORKOUT_DEFAULT_LIMIT),
        },
      );
      return object({ records: (data.records ?? []).map(toWorkout) });
    },
  );
}
