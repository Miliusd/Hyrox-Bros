"use server";

import { revalidatePath } from "next/cache";
import type { WorkoutType } from "@/lib/constants";
import { calculateLoad } from "@/lib/load";
import { requireProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { resultSchema, workoutSchema } from "@/lib/validation";
import { estimateStructureSeconds, structureAverageRpe } from "@/lib/workout";

type Result = { ok: boolean; error?: string; id?: string };

export async function saveWorkout(input: unknown): Promise<Result> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    const db = await createClient();
    const me = await requireProfile();
    const target = (await db.from("profiles").select("threshold_pace_sec_per_km").eq("id", parsed.data.athleteId).single()).data;
    const pace = target?.threshold_pace_sec_per_km ?? 270;
    const duration = Math.round(estimateStructureSeconds(parsed.data.structure, pace));
    const load = calculateLoad(duration, structureAverageRpe(parsed.data.structure, pace), parsed.data.type as WorkoutType);
    const values = {
      athlete_id: parsed.data.athleteId,
      date: parsed.data.date,
      title: parsed.data.title,
      type: parsed.data.type,
      structure: parsed.data.structure,
      coach_notes: parsed.data.coachNotes,
      planned_duration_sec: duration,
      planned_load: load,
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
    const load = calculateLoad(parsed.data.durationSec, parsed.data.rpe, workout.type as WorkoutType, parsed.data.calories);
    const { error } = await db.from("workout_results").upsert({
      workout_id: parsed.data.workoutId,
      athlete_id: workout.athlete_id,
      date: workout.date,
      duration_sec: parsed.data.durationSec,
      calories: parsed.data.calories,
      rpe: parsed.data.rpe,
      feeling: parsed.data.feeling,
      load,
      notes: parsed.data.notes,
      step_results: parsed.data.stepResults,
    }, { onConflict: "workout_id" });
    if (error) throw error;
    await db.from("workouts").update({ status: "completed" }).eq("id", parsed.data.workoutId);
    revalidatePath("/");
    revalidatePath(`/workout/${parsed.data.workoutId}`);
    return { ok: true, id: parsed.data.workoutId };
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
  rpe: number;
  feeling?: number;
  notes?: string;
}): Promise<Result> {
  try {
    const db = await createClient();
    const me = await requireProfile();
    const load = calculateLoad(input.durationSec, input.rpe, input.type, input.calories);
    const { data, error } = await db.from("workouts").insert({
      athlete_id: input.athleteId,
      created_by: me.id,
      date: input.date,
      title: input.title,
      type: input.type,
      structure: { blocks: [] },
      planned_duration_sec: input.durationSec,
      planned_load: load,
      status: "completed",
    }).select("id").single();
    if (error) throw error;
    const result = await db.from("workout_results").insert({
      workout_id: data.id,
      athlete_id: input.athleteId,
      date: input.date,
      duration_sec: input.durationSec,
      calories: input.calories,
      rpe: input.rpe,
      feeling: input.feeling,
      load,
      notes: input.notes,
    });
    if (result.error) throw result.error;
    revalidatePath("/");
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not log activity" };
  }
}
