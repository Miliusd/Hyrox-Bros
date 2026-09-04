import Link from "next/link";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import { formatDuration } from "@/lib/workout";

export type WorkoutCardData = { id: string; title: string; type: WorkoutType; planned_duration_sec: number; status: "planned" | "completed" | "skipped"; result?: { duration_sec: number; load: number } | null; athlete?: { display_name: string; emoji: string } };
export function WorkoutCard({ workout, crew = false }: { workout: WorkoutCardData; crew?: boolean }) { const type = WORKOUT_TYPES[workout.type]; return <Link href={`/workout/${workout.id}`} className="block rounded-xl border border-ink-700 bg-ink-900 p-3 transition hover:-translate-y-0.5 hover:border-ink-600" style={{ borderLeftColor: type.colour, borderLeftWidth: 3 }}>
  <div className="flex items-start justify-between gap-3"><div><div className="font-bold">{type.emoji} {workout.title}</div>{crew && workout.athlete && <div className="mt-1 text-sm text-ink-400">{workout.athlete.emoji} {workout.athlete.display_name}</div>}</div><span className={workout.status === "completed" ? "text-emerald-400" : workout.status === "skipped" ? "text-ink-400" : "text-brand-400"}>{workout.status === "completed" ? "✓" : workout.status === "skipped" ? "—" : "○"}</span></div>
  <div className="mt-2 flex gap-3 text-sm text-ink-400">
    <span>{formatDuration(workout.result?.duration_sec ?? workout.planned_duration_sec)}</span>
    {workout.result ? <span>{workout.result.load} actual load</span> : workout.status === "completed" ? <span className="text-amber-300">Result missing</span> : <span>Planned</span>}
  </div>
  </Link>; }
