import { type MCPServer, object } from "mcp-use/server";
import { z } from "zod";
import { requireToken } from "../whoop/auth";
import { whoopFetch } from "../whoop/client";
import type { RawBody, RawProfile } from "../whoop/raw";
import { profileSchema } from "../whoop/schemas";
import { toProfile } from "../whoop/transform";

export function registerProfile<H extends boolean>(server: MCPServer<H>): void {
  server.tool(
    {
      name: "whoop_profile",
      title: "WHOOP profile",
      description:
        "User profile and body measurements in one call: name, email, height (m), weight (kg), max HR.",
      schema: z.object({}),
      outputSchema: profileSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (_p, ctx) => {
      const token = requireToken(ctx);
      const [profile, body] = await Promise.all([
        whoopFetch<RawProfile>(token, "/v2/user/profile/basic"),
        whoopFetch<RawBody>(token, "/v2/user/measurement/body"),
      ]);
      return object(toProfile(profile, body));
    },
  );
}
