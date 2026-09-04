import { eachDayOfInterval, formatISO, parseISO } from "date-fns";
import { WORKOUT_TYPES, type WorkoutType } from "./constants";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calorieAdjustmentFactor(durationSec: number, calories?: number) {
  if (!calories || calories <= 0 || durationSec <= 0) return 1;
  const expectedCalories = (durationSec / 3600) * 600;
  return Math.min(1.25, Math.max(0.75, calories / expectedCalories));
}

export function heartRateIntensity(averageHrBpm: number, maxHrBpm: number) {
  if (averageHrBpm <= 0 || maxHrBpm <= 0) return 0;
  return clamp(averageHrBpm / maxHrBpm, 0.4, 1);
}

function loadFromIntensity(durationSec: number, intensity: number, type: WorkoutType, calories?: number) {
  const baseLoad = (durationSec / 3600) * (intensity / 0.8) ** 2 * 100 * WORKOUT_TYPES[type].factor;
  return Math.round(baseLoad * calorieAdjustmentFactor(durationSec, calories));
}

export function calculateHeartRateLoad(durationSec: number, averageHrBpm: number, maxHrBpm: number, type: WorkoutType, calories?: number) {
  return loadFromIntensity(durationSec, heartRateIntensity(averageHrBpm, maxHrBpm), type, calories);
}

// Kept only because the existing database requires an integer in its legacy RPE column.
export function compatibilityRpeFromHeartRate(averageHrBpm: number, maxHrBpm: number) {
  return Math.round(clamp(heartRateIntensity(averageHrBpm, maxHrBpm) * 10, 1, 10));
}

export type FitnessPoint = { date: string; load: number; fitness: number; fatigue: number; form: number };
export function buildFitnessSeries(dates: string[], dailyLoad: Record<string, number>): FitnessPoint[] {
  let fitness = 0;
  let fatigue = 0;
  const ctl = 1 - Math.exp(-1 / 42);
  const atl = 1 - Math.exp(-1 / 7);
  return dates.map((date) => {
    const load = dailyLoad[date] ?? 0;
    const form = fitness - fatigue;
    fitness += ctl * (load - fitness);
    fatigue += atl * (load - fatigue);
    return { date, load, fitness, fatigue, form };
  });
}

export function fitnessRange(start: string, end: string, dailyLoad: Record<string, number>) {
  return buildFitnessSeries(eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map((date) => formatISO(date, { representation: "date" })), dailyLoad);
}

export function formBand(form: number) {
  if (form > 15) return { label: "Fresh", colour: "#38bdf8", hint: "Ready for a hard effort or race." };
  if (form >= -10) return { label: "Neutral", colour: "#4ade80", hint: "A balanced place for steady training." };
  if (form >= -30) return { label: "Building", colour: "#fbbf24", hint: "Productive fatigue—prioritise recovery." };
  return { label: "Overreaching", colour: "#ef4444", hint: "Back off and recover before adding load." };
}

export function rampRate(thisWeek: number, lastWeek: number) {
  return lastWeek === 0 ? (thisWeek ? 100 : 0) : ((thisWeek - lastWeek) / lastWeek) * 100;
}
