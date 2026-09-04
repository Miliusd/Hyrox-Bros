import { createClient } from "./supabase/server";

function normalizeWorkoutResults<T extends { workout_results: unknown }>(workout: T) {
  return {
    ...workout,
    workout_results: Array.isArray(workout.workout_results)
      ? workout.workout_results
      : workout.workout_results
        ? [workout.workout_results]
        : [],
  };
}

export async function getWeekWorkouts(athleteId: string, start: string, end: string) { const db = await createClient(); const data=(await db.from("workouts").select("*, workout_results(*)").eq("athlete_id", athleteId).gte("date", start).lte("date", end).order("date").order("sort_order")).data ?? []; return data.map(normalizeWorkoutResults); }
export async function getWeekWorkoutsForCrew(start: string, end: string) { const db = await createClient(); const data=(await db.from("workouts").select("*, athlete:profiles!workouts_athlete_id_fkey(display_name,emoji), workout_results(*)").gte("date", start).lte("date", end).order("date").order("sort_order")).data ?? []; return data.map(normalizeWorkoutResults); }
export async function getCrewLoads(start: string, end: string) { const db = await createClient(); return (await db.from("workout_results").select("athlete_id,load, athlete:profiles!workout_results_athlete_id_fkey(display_name,emoji)").gte("date", start).lte("date", end)).data ?? []; }
export async function getFitnessRows(athleteId: string, start: string, end: string) { const db = await createClient(); return (await db.from("workout_results").select("date,load,workouts(type)").eq("athlete_id", athleteId).gte("date", start).lte("date", end).order("date")).data ?? []; }
export async function getWorkoutDetail(id: string) { const db = await createClient(); const data=(await db.from("workouts").select("*, profiles!workouts_athlete_id_fkey(*), workout_results(*), comments(*, profiles(*))").eq("id", id).single()).data; return data ? normalizeWorkoutResults(data) : null; }
export async function getStationResults(athleteId?: string) { const db = await createClient(); let query = db.from("station_results").select("*, profiles(display_name,emoji)").order("date", { ascending: false }); if (athleteId) query = query.eq("athlete_id", athleteId); return (await query).data ?? []; }
export async function getTemplates() { const db = await createClient(); return (await db.from("plan_templates").select("*, profiles(display_name), plan_template_items(*)").order("created_at", { ascending: false })).data ?? []; }
export async function getTemplateDetail(id: string) { const db = await createClient(); return (await db.from("plan_templates").select("*, plan_template_items(*)").eq("id", id).single()).data; }
