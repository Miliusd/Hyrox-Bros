import { notFound } from "next/navigation";
import { WorkoutBuilder } from "@/components/workout-builder";
import { ResultLogger, type StrengthResultInput } from "@/components/result-logger";
import type { WorkoutType } from "@/lib/constants";
import { getWorkoutDetail } from "@/lib/data";
import { getMembers, requireProfile } from "@/lib/session";
import type { WorkoutStructure } from "@/lib/workout";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, members, workout] = await Promise.all([requireProfile(), getMembers(), getWorkoutDetail(id)]);
  if (!workout) notFound();
  const result = workout.workout_results?.[0];
  const stepResults = Array.isArray(result?.step_results)
    ? (result.step_results as StrengthResultInput[]).filter((step) => step.exercise && step.actualLoadKg && step.actualReps)
    : [];

  return (
    <div className="py-6">
      <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Update session</p>
      <h1 className="mt-1 mb-6 text-3xl font-black">Edit workout</h1>
      <WorkoutBuilder
        members={members}
        initialAthleteId={me.id}
        initialWorkout={{
          id: workout.id,
          title: workout.title,
          date: workout.date,
          athleteId: workout.athlete_id,
          type: workout.type as WorkoutType,
          structure: workout.structure as WorkoutStructure,
          coachNotes: workout.coach_notes ?? "",
          plannedDurationSec: Number(workout.planned_duration_sec),
        }}
      />
      {(result || workout.status === "completed") && (
        <div className="mt-6">
          {!result && <p className="mb-3 rounded-xl border border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">This older workout was marked complete before its result was saved. Re-enter the missing values below; the planned duration has been filled in for you.</p>}
          <ResultLogger
            workoutId={workout.id}
            type={workout.type as WorkoutType}
            structure={workout.structure as WorkoutStructure}
            maxHrBpm={workout.profiles.max_hr_bpm ? Number(workout.profiles.max_hr_bpm) : null}
            initialDurationSec={!result ? Number(workout.planned_duration_sec) : undefined}
            initialResult={result ? {
              durationSec: Number(result.duration_sec),
              calories: result.calories ? Number(result.calories) : null,
              distanceMeters: result.distance_m ? Number(result.distance_m) : null,
              averageHrBpm: result.average_hr_bpm ? Number(result.average_hr_bpm) : null,
              load: Number(result.load),
              feeling: result.feeling ? Number(result.feeling) : null,
              notes: result.notes ?? "",
              stepResults,
            } : undefined}
          />
        </div>
      )}
    </div>
  );
}
