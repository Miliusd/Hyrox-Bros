import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentThread } from "@/components/comment-thread";
import { DeleteWorkoutButton } from "@/components/delete-workout-button";
import { ResultLogger } from "@/components/result-logger";
import type { WorkoutType } from "@/lib/constants";
import { getWorkoutDetail } from "@/lib/data";
import { describeQuantity, formatDuration, stepTitle, type WorkoutStructure } from "@/lib/workout";

type RecordedStrength = { stepId: string; exercise?: string; actualLoadKg?: number; actualReps?: number };

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = await getWorkoutDetail(id);
  if (!workout) notFound();
  const structure = workout.structure as WorkoutStructure;
  const result = workout.workout_results?.[0];
  const recordedStrength = Array.isArray(result?.step_results)
    ? (result.step_results as RecordedStrength[]).filter((step) => step.exercise && step.actualLoadKg && step.actualReps)
    : [];

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">{workout.date} · {workout.profiles.emoji} {workout.profiles.display_name}</p>
          <h1 className="mt-1 text-3xl font-black">{workout.title}</h1>
          <p className="mt-2 text-ink-400">{formatDuration(workout.planned_duration_sec)} planned · {workout.planned_load} load</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Link href={`/workout/${id}/edit`} className="btn-ghost">Edit workout</Link>
          <DeleteWorkoutButton workoutId={id} title={workout.title} />
        </div>
      </div>
      {workout.coach_notes && <aside className="mt-5 rounded-xl border-l-4 border-brand-400 bg-brand-400/10 p-4 text-ink-200">{workout.coach_notes}</aside>}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <section className="card">
            <h2 className="text-xl font-black">The plan</h2>
            {structure.blocks.length ? structure.blocks.map((block) => (
              <div key={block.id} className="mt-4">
                <div className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-400">{block.label || "Block"} · {block.rounds} round{block.rounds === 1 ? "" : "s"}</div>
                <div className="space-y-2">
                  {block.steps.map((step, index) => (
                    <div className="rounded-xl bg-ink-900 p-3" key={step.id}>
                      <b>{index + 1}. {stepTitle(step)}</b>
                      <div className="text-sm text-ink-400">{describeQuantity(step)}{step.loadKg ? ` · ${step.loadKg} kg` : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )) : <p className="mt-4 text-ink-400">Unstructured activity.</p>}
          </section>
          <CommentThread workoutId={id} initialComments={workout.comments ?? []} />
        </div>
        {workout.status === "completed" && result ? (
          <section className="card h-fit">
            <h2 className="text-xl font-black">Completed</h2>
            <p className="mt-3 text-3xl font-black text-brand-400">{result.load} load</p>
            <div className="mt-2 space-y-1 text-ink-400">
              <p>{formatDuration(result.duration_sec)}</p>
              {result.calories && <p>{result.calories} kcal</p>}
              {result.distance_m && <p>{Number((Number(result.distance_m) / 1000).toFixed(2))} km</p>}
              {result.average_hr_bpm && <p>Average HR {result.average_hr_bpm} bpm{workout.profiles.max_hr_bpm ? ` · ${Math.round(Number(result.average_hr_bpm) / Number(workout.profiles.max_hr_bpm) * 100)}% max` : ""}</p>}
            </div>
            {recordedStrength.length > 0 && (
              <div className="mt-4 border-t border-ink-700 pt-4">
                <h3 className="font-black">Strength sets</h3>
                <div className="mt-2 space-y-2">
                  {recordedStrength.map((step) => (
                    <div className="flex justify-between gap-3 rounded-lg bg-ink-900 p-2 text-sm" key={step.stepId}>
                      <span>{step.exercise}</span>
                      <b className="text-brand-400">{step.actualLoadKg} kg × {step.actualReps}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : <ResultLogger workoutId={id} type={workout.type as WorkoutType} structure={structure} maxHrBpm={workout.profiles.max_hr_bpm ? Number(workout.profiles.max_hr_bpm) : null} />}
      </div>
    </div>
  );
}
