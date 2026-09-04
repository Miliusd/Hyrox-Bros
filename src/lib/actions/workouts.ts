"use server";

import { revalidatePath } from "next/cache";
import type { WorkoutType } from "@/lib/constants";
import { calculateHeartRateLoad, compatibilityRpeFromHeartRate } from "@/lib/load";
import { requireProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { resultSchema, workoutSchema } from "@/lib/validation";
import { estimateStructureSeconds } from "@/lib/workout";

type Result = { ok: boolean; error?: string; id?: string; newPbs?: string[]; warning?: string };

function strengthStation(exercise: string) {
  const slug = exercise
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `strength_${slug || "exercise"}`;
}

export async function saveWorkout(input: unknown): Promise<Result> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    const db = await createClient();
    const me = await requireProfile();
    const target = (await db.from("profiles").select("threshold_pace_sec_per_km").eq("id", parsed.data.athleteId).single()).data;
    const pace = target?.threshold_pace_sec_per_km ?? 270;
    let duration = Math.round(estimateStructureSeconds(parsed.data.structure, pace));
    const hasPlannedSteps = parsed.data.structure.blocks.some((block) => block.steps.length > 0);
    if (parsed.data.id && !hasPlannedSteps) {
      const existing = await db.from("workouts").select("planned_duration_sec").eq("id", parsed.data.id).single();
      if (existing.error) throw existing.error;
      duration = Number(existing.data.planned_duration_sec);
    }
    const values = {
      athlete_id: parsed.data.athleteId,
      date: parsed.data.date,
      title: parsed.data.title,
      type: parsed.data.type,
      structure: parsed.data.structure,
      coach_notes: parsed.data.coachNotes,
      planned_duration_sec: duration,
      planned_load: 0,
    };
    const query = parsed.data.id
      ? db.from("workouts").update(values).eq("id", parsed.data.id)
      : db.from("workouts").insert({ ...values, created_by: me.id });
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    revalidatePath("/");
    revalidatePath(`/workout/${data.id}`);
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save workout" };
  }
}

export async function moveWorkout(id: string, date: string): Promise<Result> {
  const db = await createClient();
  await requireProfile();
  const { error } = await db.from("workouts").update({ date }).eq("id", id);
  revalidatePath("/");
  return error ? { ok: false, error: error.message } : { ok: true, id };
}

export async function deleteWorkout(id: string): Promise<Result> {
  try {
    const db = await createClient();
    await requireProfile();
    const { data, error } = await db.from("workouts").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Workout not found or you do not have permission to delete it." };
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete workout" };
  }
}

export async function setWorkoutStatus(id: string, status: "planned" | "completed" | "skipped"): Promise<Result> {
  const db = await createClient();
  await requireProfile();
  const { error } = await db.from("workouts").update({ status }).eq("id", id);
  revalidatePath("/");
  return error ? { ok: false, error: error.message } : { ok: true, id };
}

export async function logResult(input: unknown): Promise<Result> {
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    const db = await createClient();
    await requireProfile();
    const workout = (await db.from("workouts").select("athlete_id,date,type").eq("id", parsed.data.workoutId).single()).data;
    if (!workout) throw new Error("Workout not found");
    const athlete = await db.from("profiles").select("max_hr_bpm").eq("id", workout.athlete_id).single();
    if (athlete.error) throw athlete.error;
    const maxHrBpm = Number(athlete.data.max_hr_bpm);
    if (!maxHrBpm) throw new Error("Set this athlete's maximum heart rate in their profile before completing the workout.");
    if (parsed.data.averageHrBpm > maxHrBpm) throw new Error("Average heart rate cannot be higher than maximum heart rate.");
    const load = calculateHeartRateLoad(parsed.data.durationSec, parsed.data.averageHrBpm, maxHrBpm, workout.type as WorkoutType, parsed.data.calories);
    const { error } = await db.from("workout_results").upsert({
      workout_id: parsed.data.workoutId,
      athlete_id: workout.athlete_id,
      date: workout.date,
      duration_sec: parsed.data.durationSec,
      calories: parsed.data.calories,
      distance_m: parsed.data.distanceMeters,
      average_hr_bpm: parsed.data.averageHrBpm,
      rpe: compatibilityRpeFromHeartRate(parsed.data.averageHrBpm, maxHrBpm),
      feeling: parsed.data.feeling,
      load,
      notes: parsed.data.notes,
      step_results: parsed.data.stepResults,
    }, { onConflict: "workout_id" });
    if (error) throw error;
    const completed = await db.from("workouts").update({ status: "completed" }).eq("id", parsed.data.workoutId);
    if (completed.error) throw completed.error;

    const strengthBests = new Map<string, { exercise: string; load: number; reps: number }>();
    for (const step of parsed.data.stepResults) {
      if (!step.exercise || !step.actualLoadKg || !step.actualReps) continue;
      const station = strengthStation(step.exercise);
      const current = strengthBests.get(station);
      if (!current || step.actualLoadKg > current.load) {
        strengthBests.set(station, { exercise: step.exercise, load: step.actualLoadKg, reps: step.actualReps });
      }
    }

    const newPbs: string[] = [];
    let pbWarning = false;
    for (const [station, best] of strengthBests) {
      const previous = await db.from("station_results")
        .select("value")
        .eq("athlete_id", workout.athlete_id)
        .eq("station", station)
        .eq("metric", "max_kg")
        .order("value", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (previous.error) {
        pbWarning = true;
        continue;
      }
      if (previous.data && Number(previous.data.value) >= best.load) continue;
      const pb = await db.from("station_results").insert({
        athlete_id: workout.athlete_id,
        workout_id: parsed.data.workoutId,
        date: workout.date,
        station,
        metric: "max_kg",
        value: best.load,
        load_kg: best.load,
        notes: `${best.reps} reps · Auto from workout`,
      });
      if (pb.error) pbWarning = true;
      else newPbs.push(best.exercise);
    }

    revalidatePath("/");
    revalidatePath(`/workout/${parsed.data.workoutId}`);
    revalidatePath("/pbs");
    return {
      ok: true,
      id: parsed.data.workoutId,
      newPbs,
      warning: pbWarning ? "Workout was saved, but one or more PB records could not be updated." : undefined,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not log result" };
  }
}

export async function quickLogActivity(input: {
  athleteId: string;
  date: string;
  title: string;
  type: WorkoutType;
  durationSec: number;
  calories?: number;
  distanceMeters?: number;
  averageHrBpm: number;
  feeling?: number;
  notes?: string;
}): Promise<Result> {
  let createdWorkoutId: string | undefined;
  try {
    const db = await createClient();
    const me = await requireProfile();
    const athlete = await db.from("profiles").select("max_hr_bpm").eq("id", input.athleteId).single();
    if (athlete.error) throw athlete.error;
    const maxHrBpm = Number(athlete.data.max_hr_bpm);
    if (!maxHrBpm) throw new Error("Set this athlete's maximum heart rate in their profile before logging the workout.");
    if (!Number.isInteger(input.averageHrBpm) || input.averageHrBpm < 40 || input.averageHrBpm > maxHrBpm) throw new Error("Enter a valid average heart rate that does not exceed maximum heart rate.");
    const load = calculateHeartRateLoad(input.durationSec, input.averageHrBpm, maxHrBpm, input.type, input.calories);
    const { data, error } = await db.from("workouts").insert({
      athlete_id: input.athleteId,
      created_by: me.id,
      date: input.date,
      title: input.title,
      type: input.type,
      structure: { blocks: [] },
      planned_duration_sec: input.durationSec,
      planned_load: 0,
      status: "planned",
    }).select("id").single();
    if (error) throw error;
    createdWorkoutId = data.id;
    const result = await db.from("workout_results").insert({
      workout_id: data.id,
      athlete_id: input.athleteId,
      date: input.date,
      duration_sec: input.durationSec,
      calories: input.calories,
      distance_m: input.distanceMeters,
      average_hr_bpm: input.averageHrBpm,
      rpe: compatibilityRpeFromHeartRate(input.averageHrBpm, maxHrBpm),
      feeling: input.feeling,
      load,
      notes: input.notes,
    });
    if (result.error) throw result.error;
    const completed = await db.from("workouts").update({ status: "completed" }).eq("id", data.id);
    if (completed.error) throw completed.error;
    revalidatePath("/");
    return { ok: true, id: data.id };
  } catch (error) {
    if (createdWorkoutId) {
      const db = await createClient();
      await db.from("workouts").delete().eq("id", createdWorkoutId);
    }
    return { ok: false, error: error instanceof Error ? error.message : "Could not log activity" };
  }
}
