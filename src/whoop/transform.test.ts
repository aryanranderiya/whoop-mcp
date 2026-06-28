import { describe, expect, it } from "vitest";
import type { RawCycle, RawRecovery, RawSleep, RawWorkout } from "./raw";
import {
  kjToKcal,
  milliToHours,
  milliToMin,
  round1,
  toRecovery,
  toSleep,
  toStrain,
  toWorkout,
  windowToRange,
} from "./transform";

describe("unit conversions", () => {
  it("milliToMin rounds ms to whole minutes", () => {
    expect(milliToMin(3_600_000)).toBe(60);
    expect(milliToMin(90_000)).toBe(2); // 1.5 min -> 2
  });
  it("milliToHours rounds ms to 1 decimal hour", () => {
    expect(milliToHours(3_600_000)).toBe(1);
    expect(milliToHours(27_000_000)).toBe(7.5);
  });
  it("kjToKcal converts kilojoules", () => {
    expect(kjToKcal(1000)).toBe(239);
  });
  it("passes through null/undefined", () => {
    expect(milliToMin(null)).toBeNull();
    expect(kjToKcal(undefined)).toBeNull();
    expect(round1(undefined)).toBeNull();
  });
});

describe("toRecovery score-state gating", () => {
  const base: RawRecovery = {
    cycle_id: 5,
    sleep_id: "s-1",
    user_id: 1,
    created_at: "x",
    updated_at: "x",
    score_state: "PENDING_SCORE",
  };
  it("returns nulls when not scored", () => {
    const out = toRecovery(base);
    expect(out.state).toBe("PENDING_SCORE");
    expect(out.score_pct).toBeNull();
    expect(out.hrv_ms).toBeNull();
    expect(out.id).toBe(5);
    expect(out.sleep_id).toBe("s-1");
  });
  it("maps fields when scored", () => {
    const out = toRecovery({
      ...base,
      score_state: "SCORED",
      score: {
        user_calibrating: false,
        recovery_score: 64.4,
        resting_heart_rate: 52,
        hrv_rmssd_milli: 88.2,
      },
    });
    expect(out.score_pct).toBe(64);
    expect(out.hrv_ms).toBe(88.2);
    expect(out.resting_hr).toBe(52);
    expect(out.spo2_pct).toBeNull();
    expect(out.calibrating).toBe(false);
  });
});

describe("toSleep stage conversion", () => {
  const raw: RawSleep = {
    id: "u-1",
    cycle_id: 5,
    user_id: 1,
    created_at: "x",
    updated_at: "x",
    start: "2026-06-27T23:00:00Z",
    end: "2026-06-28T07:00:00Z",
    timezone_offset: "-05:00",
    nap: false,
    score_state: "SCORED",
    score: {
      stage_summary: {
        total_in_bed_time_milli: 28_800_000,
        total_awake_time_milli: 1_800_000,
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 14_400_000,
        total_slow_wave_sleep_time_milli: 7_200_000,
        total_rem_sleep_time_milli: 5_400_000,
        sleep_cycle_count: 5,
        disturbance_count: 3,
      },
      sleep_needed: {
        baseline_milli: 28_800_000,
        need_from_sleep_debt_milli: 0,
        need_from_recent_strain_milli: 0,
        need_from_recent_nap_milli: 0,
      },
      respiratory_rate: 14.2,
      sleep_performance_percentage: 88,
      sleep_consistency_percentage: 72,
      sleep_efficiency_percentage: 91,
    },
  };
  it("converts stage milli to minutes and computes hours slept", () => {
    const out = toSleep(raw);
    expect(out.stages_min).toEqual({
      light: 240,
      deep: 120,
      rem: 90,
      awake: 30,
    });
    // hours slept = in_bed - awake = (28.8M - 1.8M) ms -> 7.5h
    expect(out.hours_slept).toBe(7.5);
    expect(out.in_bed_hours).toBe(8);
    expect(out.performance_pct).toBe(88);
    expect(out.sleep_need_hours).toBe(8);
    expect(out.nap).toBe(false);
    expect(out.id).toBe("u-1");
  });
});

describe("toStrain + toWorkout", () => {
  const cycle: RawCycle = {
    id: 9,
    user_id: 1,
    created_at: "x",
    updated_at: "x",
    start: "2026-06-28T05:00:00Z",
    timezone_offset: "-05:00",
    score_state: "SCORED",
    score: {
      strain: 9.34,
      kilojoule: 8000,
      average_heart_rate: 70,
      max_heart_rate: 150,
    },
  };
  it("toStrain maps strain + converts kJ to kcal, end null when ongoing", () => {
    const out = toStrain(cycle);
    expect(out.day_strain).toBe(9.3);
    expect(out.kcal).toBe(1912); // 8000 * 0.239006 -> 1912
    expect(out.avg_hr).toBe(70);
    expect(out.end).toBeNull();
    expect(out.id).toBe(9);
  });

  const workout: RawWorkout = {
    id: "w-1",
    user_id: 1,
    created_at: "x",
    updated_at: "x",
    start: "2026-06-28T12:00:00Z",
    end: "2026-06-28T13:00:00Z",
    timezone_offset: "-05:00",
    sport_name: "running",
    score_state: "SCORED",
    score: {
      strain: 11.2,
      average_heart_rate: 140,
      max_heart_rate: 175,
      kilojoule: 2000,
      percent_recorded: 100,
      distance_meter: 10000.4,
      zone_durations: {
        zone_zero_milli: 0,
        zone_one_milli: 600_000,
        zone_two_milli: 1_200_000,
        zone_three_milli: 900_000,
        zone_four_milli: 600_000,
        zone_five_milli: 300_000,
      },
    },
  };
  it("toWorkout computes duration, converts zones to minutes", () => {
    const out = toWorkout(workout);
    expect(out.duration_min).toBe(60);
    expect(out.sport).toBe("running");
    expect(out.distance_m).toBe(10000.4);
    expect(out.hr_zones_min).toEqual({
      z0: 0,
      z1: 10,
      z2: 20,
      z3: 15,
      z4: 10,
      z5: 5,
    });
    expect(out.altitude_gain_m).toBeNull();
  });
});

describe("windowToRange", () => {
  it("computes an inclusive start N days before a fixed now", () => {
    const now = Date.parse("2026-06-28T00:00:00Z");
    const { start, end } = windowToRange(7, now);
    expect(end).toBe("2026-06-28T00:00:00.000Z");
    expect(start).toBe("2026-06-21T00:00:00.000Z");
  });
});
