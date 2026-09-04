"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveWorkout } from "@/lib/actions/workouts";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import type { Division } from "@/lib/hyrox";
import { calculateLoad } from "@/lib/load";
import { estimateStructureSeconds, formatDuration, structureAverageRpe, type WorkoutStructure } from "@/lib/workout";
import { StructureEditor } from "./structure-editor";

type Member = { id: string; display_name: string; emoji: string; division: Division };
export type InitialWorkout = {
  id: string;
  title: string;
  date: string;
  athleteId: string;
  type: WorkoutType;
  structure: WorkoutStructure;
  coachNotes: string;
};

export function WorkoutBuilder({
  date = new Date().toISOString().slice(0, 10),
  members,
  initialAthleteId,
  initialWorkout,
}: {
  date?: string;
  members: Member[];
  initialAthleteId: string;
  initialWorkout?: InitialWorkout;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialWorkout?.title ?? "");
  const [workoutDate, setWorkoutDate] = useState(initialWorkout?.date ?? date);
  const [athleteId, setAthleteId] = useState(initialWorkout?.athleteId ?? initialAthleteId);
  const [notes, setNotes] = useState(initialWorkout?.coachNotes ?? "");
  const [structure, setStructure] = useState<WorkoutStructure>(initialWorkout?.structure ?? { blocks: [] });
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type ?? "hyrox_sim");
  const [error, setError] = useState("");
  const selectedMember = members.find((member) => member.id === athleteId) ?? members[0];
  const stats = useMemo(() => {
    const seconds = estimateStructureSeconds(structure);
    return { seconds, load: calculateLoad(seconds, structureAverageRpe(structure), type) };
  }, [structure, type]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveWorkout({
        id: initialWorkout?.id,
        athleteId,
        date: workoutDate,
        title,
        type,
        structure,
        coachNotes: notes,
      });
      if (result.ok && result.id) {
        router.push(`/workout/${result.id}`);
        router.refresh();
      } else {
        setError(result.error ?? "Could not save workout");
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Title</span>
          <input className="input" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Sled + run intervals" />
        </label>
        <label>
          <span className="label">Date</span>
          <input className="input" type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value)} required />
        </label>
        <label>
          <span className="label">Athlete</span>
          <select className="input" value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
            {members.map((member) => <option value={member.id} key={member.id}>{member.emoji} {member.display_name}</option>)}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="label">Type</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WORKOUT_TYPES).map(([key, meta]) => (
            <button type="button" key={key} onClick={() => setType(key as WorkoutType)} className={`chip ${type === key ? "border-brand-400 bg-brand-400 text-ink-950" : ""}`}>
              {meta.emoji} {meta.label}
            </button>
          ))}
        </div>
      </fieldset>
      <StructureEditor value={structure} onChange={setStructure} division={selectedMember?.division ?? "men_open"} />
      <label>
        <span className="label">Coach notes</span>
        <textarea className="input min-h-28 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Focus, pacing or substitutions…" />
      </label>
      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300">{error}</p>}
      <div className="sticky bottom-20 z-30 flex items-center justify-between gap-4 rounded-2xl border border-ink-600 bg-ink-900/95 p-3 shadow-2xl backdrop-blur md:bottom-4">
        <div><div className="text-sm text-ink-400">Estimate</div><b>{formatDuration(stats.seconds)} · {stats.load} load</b></div>
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : initialWorkout ? "Save changes" : "Save workout"}</button>
      </div>
    </form>
  );
}
