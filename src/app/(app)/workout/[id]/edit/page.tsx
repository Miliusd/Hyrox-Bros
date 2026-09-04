import { notFound } from "next/navigation";
import { WorkoutBuilder } from "@/components/workout-builder";
import type { WorkoutType } from "@/lib/constants";
import { getWorkoutDetail } from "@/lib/data";
import { getMembers, requireProfile } from "@/lib/session";
import type { WorkoutStructure } from "@/lib/workout";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, members, workout] = await Promise.all([requireProfile(), getMembers(), getWorkoutDetail(id)]);
  if (!workout) notFound();

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
        }}
      />
    </div>
  );
}
