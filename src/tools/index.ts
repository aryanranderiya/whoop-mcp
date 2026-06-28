import type { MCPServer } from "mcp-use/server";
import { registerGetCycle } from "./get-cycle";
import { registerGetSleep } from "./get-sleep";
import { registerGetWorkout } from "./get-workout";
import { registerOverview } from "./overview";
import { registerProfile } from "./profile";
import { registerRecovery } from "./recovery";
import { registerSleep } from "./sleep";
import { registerStrain } from "./strain";
import { registerWorkouts } from "./workouts";

export function registerTools<H extends boolean>(server: MCPServer<H>): void {
  registerOverview(server);
  registerRecovery(server);
  registerSleep(server);
  registerStrain(server);
  registerWorkouts(server);
  registerProfile(server);
  registerGetCycle(server);
  registerGetSleep(server);
  registerGetWorkout(server);
}
