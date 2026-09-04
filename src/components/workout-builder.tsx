"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveWorkout } from "@/lib/actions/workouts";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import type { Division } from "@/lib/hyrox";
import {
  buildHalfSimulation,
  buildRaceSimulation,
  estimateStructureSeconds,
  flattenSteps,
  formatDuration,
  type WorkoutStructure,
} from "@/lib/workout";
import { StructureEditor } from "./structure-editor";

type Member = { id: string; display_name: string; emoji: string; division: Division };
export type WorkoutDraft = { id: string; title: string; type: WorkoutType; structure: WorkoutStructure; notes: string };
export type InitialWorkout = {
  id: string;
  title: string;
  date: string;
  athleteId: string;
  type: WorkoutType;
  structure: WorkoutStructure;
  coachNotes: string;
  plannedDurationSec: number;
};

export function WorkoutBuilder({
  date = new Date().toISOString().slice(0, 10),
  members,
  initialAthleteId,
  initialWorkout,
  drafts = [],
  initialDraftId,
}: {
  date?: string;
  members: Member[];
  initialAthleteId: string;
  initialWorkout?: InitialWorkout;
  drafts?: WorkoutDraft[];
  initialDraftId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const startingDraft = !initialWorkout ? drafts.find((draft) => draft.id === initialDraftId) : undefined;
  const [draftId, setDraftId] = useState(startingDraft?.id ?? "");
  const [title, setTitle] = useState(initialWorkout?.title ?? startingDraft?.title ?? "");
  const [workoutDate, setWorkoutDate] = useState(initialWorkout?.date ?? date);
  const [athleteId, setAthleteId] = useState(initialWorkout?.athleteId ?? initialAthleteId);
  const [notes, setNotes] = useState(initialWorkout?.coachNotes ?? startingDraft?.notes ?? "");
  const [notesOpen, setNotesOpen] = useState(Boolean(initialWorkout?.coachNotes || startingDraft?.notes));
  const [structure, setStructure] = useState<WorkoutStructure>(initialWorkout?.structure ?? startingDraft?.structure ?? { blocks: [] });
  const [structureOpen, setStructureOpen] = useState(false);
  const [type, setType] = useState<WorkoutType>(initialWorkout?.type ?? startingDraft?.type ?? "hyrox_sim");
  const [error, setError] = useState("");
  const selectedMember = members.find((member) => member.id === athleteId) ?? members[0];
  const hasStructure = structure.blocks.some((block) => block.steps.length > 0);
  const stepCount = hasStructure ? flattenSteps(structure).length : 0;
  const plannedSeconds = initialWorkout && !hasStructure
    ? initialWorkout.plannedDurationSec
    : estimateStructureSeconds(structure);

  function applyDraft(id: string) {
    setDraftId(id);
    const draft = drafts.find((candidate) => candidate.id === id);
    if (!draft) {
      setTitle("");
      setType("hyrox_sim");
      setStructure({ blocks: [] });
      setNotes("");
      setNotesOpen(false);
      setStructureOpen(false);
      return;
    }
    setTitle(draft.title);
    setType(draft.type);
    setStructure(draft.structure);
    setNotes(draft.notes);
    setNotesOpen(Boolean(draft.notes));
    setStructureOpen(false);
  }

  function chooseStructure(next: WorkoutStructure) {
    setStructure(next);
    setStructureOpen(false);
  }

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
    <form className="form-with-sticky-action space-y-5" onSubmit={submit}>
      {!initialWorkout && drafts.length > 0 && (
        <section className="card">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-700 text-sm font-black text-brand-400">↗</span>
            <div className="min-w-0 flex-1">
              <label htmlFor="workout-template" className="label">Start from a template <span className="font-normal text-ink-400">· optional</span></label>
              <select id="workout-template" className="input" value={draftId} onChange={(event) => applyDraft(event.target.value)}>
                <option value="">Blank workout</option>
                {drafts.map((draft) => <option value={draft.id} key={draft.id}>{draft.title}</option>)}
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <SectionHeading number="1" title="Session details" description="Name it, schedule it, and choose who it is for." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="sm:col-span-2 lg:col-span-3">
            <span className="label">Workout title</span>
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
          <label>
            <span className="label">Workout type</span>
            <select className="input" value={type} onChange={(event) => setType(event.target.value as WorkoutType)}>
              {Object.entries(WORKOUT_TYPES).map(([key, meta]) => <option value={key} key={key}>{meta.emoji} {meta.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeading number="2" title="Workout content" description="Choose a shortcut or build the session step by step." />
            {structureOpen && (
              <button type="button" className="btn-ghost" onClick={() => setStructureOpen(false)}>Done editing</button>
            )}
          </div>

          {!structureOpen && hasStructure && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4">
              <div>
                <div className="font-black">Workout structure ready</div>
                <p className="mt-1 text-sm text-ink-400">
                  {stepCount} step{stepCount === 1 ? "" : "s"} across {structure.blocks.length} block{structure.blocks.length === 1 ? "" : "s"} · {formatDuration(plannedSeconds)}
                </p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setStructureOpen(true)}>Edit structure</button>
            </div>
          )}

          {!structureOpen && !hasStructure && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StructureChoice
                icon="＋"
                title="Build your own"
                description="Add runs, stations, rest, or strength work."
                primary
                onClick={() => setStructureOpen(true)}
              />
              <StructureChoice
                icon="½"
                title="Half simulation"
                description="Four runs and the first four stations."
                onClick={() => chooseStructure(buildHalfSimulation(selectedMember?.division ?? "men_open"))}
              />
              <StructureChoice
                icon="🔥"
                title="Full simulation"
                description="The complete eight-station race format."
                onClick={() => chooseStructure(buildRaceSimulation(selectedMember?.division ?? "men_open"))}
              />
            </div>
          )}
        </div>

        {structureOpen && (
          <StructureEditor value={structure} onChange={setStructure} division={selectedMember?.division ?? "men_open"} />
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading number="3" title="Coach notes" description={notes ? "Notes added to this workout." : "Optional pacing, focus, or substitution guidance."} />
          <button type="button" className="btn-ghost" onClick={() => setNotesOpen((open) => !open)} aria-expanded={notesOpen}>
            {notesOpen ? "Hide notes" : notes ? "Edit notes" : "＋ Add notes"}
          </button>
        </div>
        {notesOpen && (
          <label className="mt-5 block">
            <span className="sr-only">Coach notes</span>
            <textarea className="input min-h-28 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Focus, pacing or substitutions…" />
          </label>
        )}
      </section>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300" role="alert">{error}</p>}
      <div className="sticky-action-bar">
        <div>
          <div className="text-sm text-ink-400">Planned duration</div>
          <b>{hasStructure || initialWorkout ? formatDuration(plannedSeconds) : "Add workout content"}</b>
        </div>
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : initialWorkout ? "Save changes" : "Save workout"}</button>
      </div>
    </form>
  );
}

function SectionHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-400 text-sm font-black text-ink-950">{number}</span>
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-400">{description}</p>
      </div>
    </div>
  );
}

function StructureChoice({
  icon,
  title,
  description,
  primary = false,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-32 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-400 ${primary ? "border-brand-500 bg-brand-400/10" : "border-ink-700 bg-ink-900"}`}
      onClick={onClick}
    >
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="mt-3 block font-black">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-ink-400">{description}</span>
    </button>
  );
}
