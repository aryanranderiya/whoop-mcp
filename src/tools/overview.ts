import { type MCPServer, object } from "mcp-use/server";
import { z } from "zod";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type {
  Paginated,
  RawBody,
  RawCycle,
  RawProfile,
  RawRecovery,
  RawSleep,
} from "../whoop/raw";
import { type OverviewOut, overviewSchema } from "../whoop/schemas";
import {
  toProfile,
  toRecoveryCore,
  toSleepCore,
  toStrainCore,
} from "../whoop/transform";

function buildSummary(o: OverviewOut): string {
  const parts: string[] = [];
  if (o.recovery?.score_pct != null)
    parts.push(`recovery ${o.recovery.score_pct}%`);
  if (o.sleep?.hours_slept != null) {
    const perf =
      o.sleep.performance_pct != null
        ? ` at ${o.sleep.performance_pct}% performance`
        : "";
    parts.push(`slept ${o.sleep.hours_slept}h${perf}`);
  }
  if (o.strain?.day_strain != null)
    parts.push(`day strain ${o.strain.day_strain}`);
  if (parts.length === 0) return "No scored WHOOP data available yet.";
  const s = parts.join(", ");
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

export function registerOverview<H extends boolean>(
  server: MCPServer<H>,
): void {
  server.tool(
    {
      name: "whoop_overview",
      title: "WHOOP overview",
      description:
        "Single-call snapshot of the user's current WHOOP status: latest recovery, last sleep, current day strain, plus profile and body measurements. Call this first for general WHOOP context.",
      schema: z.object({}),
      outputSchema: overviewSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (_p, ctx) => {
      const token = requireToken(ctx);
      const [rec, sleep, cycle, profile, body] = await Promise.all([
        whoopFetch<Paginated<RawRecovery>>(token, "/v2/recovery", { limit: 1 }),
        whoopFetch<Paginated<RawSleep>>(token, "/v2/activity/sleep", {
          limit: 1,
        }),
        whoopFetch<Paginated<RawCycle>>(token, "/v2/cycle", { limit: 1 }),
        whoopFetch<RawProfile>(token, "/v2/user/profile/basic"),
        whoopFetch<RawBody>(token, "/v2/user/measurement/body"),
      ]);
      const prof = toProfile(profile, body);
      const out: OverviewOut = {
        recovery: rec.records?.[0] ? toRecoveryCore(rec.records[0]) : null,
        sleep: sleep.records?.[0] ? toSleepCore(sleep.records[0]) : null,
        strain: cycle.records?.[0] ? toStrainCore(cycle.records[0]) : null,
        profile: { name: prof.name },
        body: {
          height_m: prof.height_m,
          weight_kg: prof.weight_kg,
          max_hr: prof.max_hr,
        },
        summary: "",
      };
      out.summary = buildSummary(out);
      return object(out);
    },
  );
}
