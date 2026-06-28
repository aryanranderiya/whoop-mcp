import { z } from "zod";

// Output schemas are the single source of truth for tool return shapes.
// Each tool declares one as its `outputSchema`, and the transform layer is
// typed against the inferred type — so a shape drift is a compile error.

export const scoreState = z
  .enum(["SCORED", "PENDING_SCORE", "UNSCORABLE"])
  .describe("Scoring state. Metrics are null unless SCORED.");

const stagesMin = z
  .object({
    light: z.number().describe("Light sleep, minutes"),
    deep: z.number().describe("Deep (slow-wave) sleep, minutes"),
    rem: z.number().describe("REM sleep, minutes"),
    awake: z.number().describe("Awake time, minutes"),
  })
  .describe("Sleep stage durations in minutes");

const hrZonesMin = z
  .object({
    z0: z.number(),
    z1: z.number(),
    z2: z.number(),
    z3: z.number(),
    z4: z.number(),
    z5: z.number(),
  })
  .describe(
    "Minutes spent in each heart-rate zone (z0 very light → z5 max effort)",
  );

// ---- Recovery ----
export const recoveryCoreSchema = z.object({
  state: scoreState,
  score_pct: z.number().nullable().describe("Recovery score 0-100%"),
  hrv_ms: z.number().nullable().describe("HRV RMSSD in milliseconds"),
  resting_hr: z.number().nullable().describe("Resting heart rate, bpm"),
  spo2_pct: z.number().nullable().describe("Blood oxygen %, WHOOP 4.0+ only"),
  skin_temp_c: z
    .number()
    .nullable()
    .describe("Skin temperature °C, WHOOP 4.0+ only"),
  calibrating: z
    .boolean()
    .nullable()
    .describe("WHOOP still calibrating the user's baseline"),
});
export const recoverySchema = recoveryCoreSchema.extend({
  id: z.number().describe("Cycle id this recovery belongs to"),
  sleep_id: z.string().describe("Sleep UUID this recovery is derived from"),
});

// ---- Sleep ----
export const sleepCoreSchema = z.object({
  start: z.string().describe("Sleep start (ISO-8601)"),
  end: z.string().describe("Sleep end (ISO-8601)"),
  nap: z.boolean().describe("Whether this sleep was a nap"),
  state: scoreState,
  performance_pct: z.number().nullable().describe("Sleep performance 0-100%"),
  efficiency_pct: z.number().nullable().describe("Sleep efficiency 0-100%"),
  consistency_pct: z.number().nullable().describe("Sleep consistency 0-100%"),
  hours_slept: z
    .number()
    .nullable()
    .describe("Actual time asleep, hours (in-bed minus awake)"),
  in_bed_hours: z.number().nullable().describe("Total time in bed, hours"),
  stages_min: stagesMin.nullable(),
  respiratory_rate: z
    .number()
    .nullable()
    .describe("Respiratory rate, breaths/min"),
  sleep_need_hours: z.number().nullable().describe("Total sleep needed, hours"),
});
export const sleepSchema = sleepCoreSchema.extend({
  id: z.string().describe("Sleep UUID"),
});

// ---- Strain / cycle ----
export const strainCoreSchema = z.object({
  start: z.string().describe("Cycle start (ISO-8601)"),
  end: z
    .string()
    .nullable()
    .describe("Cycle end (ISO-8601); null if the cycle is ongoing"),
  state: scoreState,
  day_strain: z.number().nullable().describe("Day strain 0-21"),
  avg_hr: z.number().nullable().describe("Average heart rate, bpm"),
  max_hr: z.number().nullable().describe("Max heart rate, bpm"),
  kcal: z.number().nullable().describe("Energy expended, kcal"),
});
export const strainSchema = strainCoreSchema.extend({
  id: z.number().describe("Cycle id"),
});

// ---- Workout ----
export const workoutSchema = z.object({
  id: z.string().describe("Workout UUID"),
  sport: z.string().describe("Sport name, e.g. running"),
  start: z.string().describe("Workout start (ISO-8601)"),
  end: z.string().describe("Workout end (ISO-8601)"),
  duration_min: z.number().describe("Duration, minutes"),
  state: scoreState,
  strain: z.number().nullable().describe("Workout strain 0-21"),
  avg_hr: z.number().nullable().describe("Average heart rate, bpm"),
  max_hr: z.number().nullable().describe("Max heart rate, bpm"),
  kcal: z.number().nullable().describe("Energy expended, kcal"),
  distance_m: z.number().nullable().describe("Distance, meters (if recorded)"),
  altitude_gain_m: z
    .number()
    .nullable()
    .describe("Altitude gain, meters (if recorded)"),
  percent_recorded: z
    .number()
    .nullable()
    .describe("% of the workout with HR data"),
  hr_zones_min: hrZonesMin.nullable(),
});

// ---- Profile ----
export const profileSchema = z.object({
  user_id: z.number().describe("WHOOP user id"),
  name: z.string().describe("Full name"),
  email: z.string().describe("Email"),
  height_m: z.number().describe("Height, meters"),
  weight_kg: z.number().describe("Weight, kilograms"),
  max_hr: z.number().describe("Max heart rate, bpm"),
});

// ---- Overview (the major context tool) ----
export const overviewSchema = z.object({
  recovery: recoveryCoreSchema.nullable().describe("Latest recovery"),
  sleep: sleepCoreSchema.nullable().describe("Most recent sleep"),
  strain: strainCoreSchema.nullable().describe("Current/most recent day cycle"),
  profile: z.object({ name: z.string() }).nullable(),
  body: z
    .object({
      height_m: z.number(),
      weight_kg: z.number(),
      max_hr: z.number(),
    })
    .nullable(),
  summary: z.string().describe("One-line human-readable snapshot"),
});

// ---- Cycle detail (per-id) ----
export const cycleDetailSchema = z.object({
  cycle: strainSchema,
  recovery: recoverySchema.nullable(),
  sleep: sleepSchema.nullable(),
});

// ---- Collection wrappers ----
export const recoveryCollectionSchema = z.object({
  records: z.array(recoverySchema),
});
export const sleepCollectionSchema = z.object({
  records: z.array(sleepSchema),
});
export const strainCollectionSchema = z.object({
  records: z.array(strainSchema),
});
export const workoutCollectionSchema = z.object({
  records: z.array(workoutSchema),
});

export type RecoveryCore = z.infer<typeof recoveryCoreSchema>;
export type RecoveryOut = z.infer<typeof recoverySchema>;
export type SleepCore = z.infer<typeof sleepCoreSchema>;
export type SleepOut = z.infer<typeof sleepSchema>;
export type StrainCore = z.infer<typeof strainCoreSchema>;
export type StrainOut = z.infer<typeof strainSchema>;
export type WorkoutOut = z.infer<typeof workoutSchema>;
export type ProfileOut = z.infer<typeof profileSchema>;
export type OverviewOut = z.infer<typeof overviewSchema>;
export type CycleDetailOut = z.infer<typeof cycleDetailSchema>;
