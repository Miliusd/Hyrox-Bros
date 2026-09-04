"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDraft, saveDraft } from "@/lib/actions/templates";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import type { Division } from "@/lib/hyrox";
import { estimateStructureSeconds, formatDuration, type WorkoutStructure } from "@/lib/workout";
import { StructureEditor } from "./structure-editor";

export type InitialDraft = {
  id: string;
  itemId?: string;
  title: string;
  description: string;
  type: WorkoutType;
  structure: WorkoutStructure;
  notes: string;
};

export function DraftBuilder({ division, initialDraft }: { division: Division; initialDraft?: InitialDraft }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [type, setType] = useState<WorkoutType>(initialDraft?.type ?? "hyrox_sim");
  const [structure, setStructure] = useState<WorkoutStructure>(initialDraft?.structure ?? { blocks: [] });
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const [message, setMessage] = useState("");
  const duration = estimateStructureSeconds(structure);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveDraft({ id: initialDraft?.id, itemId: initialDraft?.itemId, title, description, type, structure, notes });
      if (result.ok && result.id) {
        router.push(`/templates/${result.id}`);
        router.refresh();
      } else setMessage(result.error ?? "Could not save draft");
    });
  }

  function remove() {
    if (!initialDraft || !window.confirm(`Delete the “${initialDraft.title}” draft?`)) return;
    startTransition(async () => {
      const result = await deleteDraft(initialDraft.id);
      if (result.ok) {
        router.push("/templates");
        router.refresh();
      } else setMessage(result.error ?? "Could not delete draft");
    });
  }

  return <form className="form-with-sticky-action space-y-5" onSubmit={submit}>
    <section className="card grid gap-4 sm:grid-cols-2">
      <label><span className="label">Draft name</span><input className="input" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Sled technique + intervals" /></label>
      <label><span className="label">Short description</span><input className="input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="When or why to use it" /></label>
      <fieldset className="sm:col-span-2"><legend className="label">Workout type</legend><div className="flex flex-wrap gap-2">{Object.entries(WORKOUT_TYPES).map(([key, meta]) => <button type="button" key={key} onClick={() => setType(key as WorkoutType)} className={`chip ${type === key ? "border-brand-400 bg-brand-400 text-ink-950" : ""}`}>{meta.emoji} {meta.label}</button>)}</div></fieldset>
    </section>
    <StructureEditor value={structure} onChange={setStructure} division={division} />
    <label><span className="label">Notes</span><textarea className="input min-h-28 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Technique cues, pacing or substitutions…" /></label>
    {message && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300">{message}</p>}
    <div className="sticky-action-bar">
      <div><div className="text-sm text-ink-400">Draft duration</div><b>{formatDuration(duration)}</b></div>
      <div className="flex gap-2">{initialDraft && <button type="button" className="btn-ghost border-red-800 text-red-300" disabled={pending} onClick={remove}>Delete</button>}<button className="btn-primary" disabled={pending}>{pending ? "Saving…" : initialDraft ? "Save draft" : "Create draft"}</button></div>
    </div>
  </form>;
}
