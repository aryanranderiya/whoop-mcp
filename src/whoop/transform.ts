import { KJ_TO_KCAL } from "../constants";
import type {
  RawBody,
  RawCycle,
  RawProfile,
  RawRecovery,
  RawSleep,
  RawWorkout,
} from "./raw";
import type {
  ProfileOut,
  RecoveryCore,
  RecoveryOut,
  SleepCore,
  SleepOut,
  StrainCore,
  StrainOut,
  WorkoutOut,
} from "./schemas";

export function round1(n?: number | null): number | null {
  return n == null ? null : Math.round(n * 10) / 10;
}
export function milliToMin(ms?: number | null): number | null {
  return ms == null ? null : Math.round(ms / 60_000);
}
export function milliToHours(ms?: number | null): number | null {
  return ms == null ? null : Math.round(ms / 360_000) / 10;
}
export function kjToKcal(kj?: number | null): number | null {
  return kj == null ? null : Math.round(kj * KJ_TO_KCAL);
}

export function toRecoveryCore(r: RawRecovery): RecoveryCore {
  const s = r.score;
  return {
    state: r.score_state,
    score_pct: s ? Math.round(s.recovery_score) : null,
    hrv_ms: s ? round1(s.hrv_rmssd_milli) : null,
    resting_hr: s ? Math.round(s.resting_heart_rate) : null,
    spo2_pct: s?.spo2_percentage != null ? round1(s.spo2_percentage) : null,
    skin_temp_c:
      s?.skin_temp_celsius != null ? round1(s.skin_temp_celsius) : null,
    calibrating: s ? s.user_calibrating : null,
  };
}
export function toRecovery(r: RawRecovery): RecoveryOut {
  return { ...toRecoveryCore(r), id: r.cycle_id, sleep_id: r.sleep_id };
}

export function toSleepCore(s: RawSleep): SleepCore {
  const sc = s.score;
  const stage = sc?.stage_summary;
  const inBed = stage?.total_in_bed_time_milli ?? null;
  const awake = stage?.total_awake_time_milli ?? null;
  const asleepMs = inBed != null && awake != null ? inBed - awake : null;
  const need = sc?.sleep_needed;
  const needTotal = need
    ? need.baseline_milli +
      need.need_from_sleep_debt_milli +
      need.need_from_recent_strain_milli +
      need.need_from_recent_nap_milli
    : null;
  return {
    start: s.start,
    end: s.end,
    nap: s.nap,
    state: s.score_state,
    performance_pct: round1(sc?.sleep_performance_percentage),
    efficiency_pct: round1(sc?.sleep_efficiency_percentage),
    consistency_pct: round1(sc?.sleep_consistency_percentage),
    hours_slept: milliToHours(asleepMs),
    in_bed_hours: milliToHours(inBed),
    stages_min: stage
      ? {
          light: milliToMin(stage.total_light_sleep_time_milli)!,
          deep: milliToMin(stage.total_slow_wave_sleep_time_milli)!,
          rem: milliToMin(stage.total_rem_sleep_time_milli)!,
          awake: milliToMin(stage.total_awake_time_milli)!,
        }
      : null,
    respiratory_rate: round1(sc?.respiratory_rate),
    sleep_need_hours: milliToHours(needTotal),
  };
}
export function toSleep(s: RawSleep): SleepOut {
  return { ...toSleepCore(s), id: s.id };
}

export function toStrainCore(c: RawCycle): StrainCore {
  const s = c.score;
  return {
    start: c.start,
    end: c.end ?? null,
    state: c.score_state,
    day_strain: s ? round1(s.strain) : null,
    avg_hr: s ? s.average_heart_rate : null,
    max_hr: s ? s.max_heart_rate : null,
    kcal: s ? kjToKcal(s.kilojoule) : null,
  };
}
export function toStrain(c: RawCycle): StrainOut {
  return { ...toStrainCore(c), id: c.id };
}

export function toWorkout(w: RawWorkout): WorkoutOut {
  const s = w.score;
  const z = s?.zone_durations;
  return {
    id: w.id,
    sport: w.sport_name,
    start: w.start,
    end: w.end,
    duration_min: Math.round(
      (Date.parse(w.end) - Date.parse(w.start)) / 60_000,
    ),
    state: w.score_state,
    strain: s ? round1(s.strain) : null,
    avg_hr: s ? s.average_heart_rate : null,
    max_hr: s ? s.max_heart_rate : null,
    kcal: s ? kjToKcal(s.kilojoule) : null,
    distance_m: s?.distance_meter != null ? round1(s.distance_meter) : null,
    altitude_gain_m:
      s?.altitude_gain_meter != null ? round1(s.altitude_gain_meter) : null,
    percent_recorded: round1(s?.percent_recorded),
    hr_zones_min: z
      ? {
          z0: milliToMin(z.zone_zero_milli)!,
          z1: milliToMin(z.zone_one_milli)!,
          z2: milliToMin(z.zone_two_milli)!,
          z3: milliToMin(z.zone_three_milli)!,
          z4: milliToMin(z.zone_four_milli)!,
          z5: milliToMin(z.zone_five_milli)!,
        }
      : null,
  };
}

export function toProfile(p: RawProfile, b: RawBody): ProfileOut {
  return {
    user_id: p.user_id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    email: p.email,
    height_m: round1(b.height_meter)!,
    weight_kg: round1(b.weight_kilogram)!,
    max_hr: b.max_heart_rate,
  };
}

export function windowToRange(
  days: number,
  nowMs: number = Date.now(),
): { start: string; end: string } {
  const end = new Date(nowMs);
  const start = new Date(nowMs - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
