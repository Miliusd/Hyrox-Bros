"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { quickLogActivity } from "@/lib/actions/workouts";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import { calculateLoad, calorieAdjustmentFactor } from "@/lib/load";
import { parseDuration } from "@/lib/workout";

const suggestions = ["Basketball", "Football", "Padel", "Swim", "Bike", "Hike", "Climbing", "Skiing"];
type Member = { id: string; display_name: string; emoji: string };

export function QuickLogForm({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [athleteId, setAthleteId] = useState(currentUserId); const [duration, setDuration] = useState("45:00"); const [calories, setCalories] = useState(""); const [rpe, setRpe] = useState(6); const [type, setType] = useState<WorkoutType>("other"); const [feeling, setFeeling] = useState<number>(); const [notes, setNotes] = useState(""); const [error, setError] = useState("");
  const durationSec = parseDuration(duration) ?? 0; const caloriesValue = calories ? Number(calories) : undefined; const baseLoad = calculateLoad(durationSec, rpe, type); const energyFactor = calorieAdjustmentFactor(durationSec, caloriesValue); const load = calculateLoad(durationSec, rpe, type, caloriesValue);
  function submit(event: React.FormEvent) { event.preventDefault(); setError(""); if (!durationSec) { setError("Enter a valid duration such as 45:00."); return; } startTransition(async () => { const result = await quickLogActivity({ athleteId, date, title, type, durationSec, calories: caloriesValue, rpe, feeling, notes }); if (result.ok && result.id) router.push(`/workout/${result.id}`); else setError(result.error ?? "Could not log activity"); }); }
  return <form className="space-y-5" onSubmit={submit}><label><span className="label">Activity</span><input className="input" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What did you do?" /></label><div className="flex flex-wrap gap-2">{suggestions.map((item) => <button type="button" className="chip" key={item} onClick={() => setTitle(item)}>{item}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-4"><label><span className="label">Date</span><input type="date" className="input" value={date} onChange={(event)=>setDate(event.target.value)} required/></label><label><span className="label">Who</span><select className="input" value={athleteId} onChange={(event)=>setAthleteId(event.target.value)}>{members.map((member)=><option value={member.id} key={member.id}>{member.emoji} {member.display_name}</option>)}</select></label><label><span className="label">Duration</span><input className="input" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="mm:ss" required/></label><label><span className="label">Calories burned</span><input className="input" type="number" inputMode="numeric" min="1" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="Optional" /></label></div>
    <fieldset><legend className="label">Type</legend><div className="flex flex-wrap gap-2">{Object.entries(WORKOUT_TYPES).map(([key, meta]) => <button type="button" key={key} onClick={() => setType(key as WorkoutType)} className={`chip ${type === key ? "border-brand-400 bg-brand-400 text-ink-950" : ""}`}>{meta.emoji} {meta.label}</button>)}</div></fieldset>
    <label><span className="label">RPE {rpe}</span><input type="range" className="w-full" min="1" max="10" value={rpe} onChange={(event) => setRpe(Number(event.target.value))} /></label>
    {caloriesValue && durationSec > 0 && <div className="rounded-xl border border-ink-700 bg-ink-900 p-3 text-sm text-ink-200"><div className="font-bold text-white">Load calculation</div><div className="mt-1">Base {baseLoad} × calorie adjustment {energyFactor.toFixed(2)} = <b className="text-brand-400">{load} load</b></div><div className="mt-1 text-ink-400">Calories adjust the estimate by at most 25%.</div></div>}
    <fieldset><legend className="label">Feeling</legend><div className="flex gap-2">{["😫", "🙁", "😐", "🙂", "🤩"].map((emoji,index) => <button type="button" key={emoji} onClick={()=>setFeeling(index+1)} className={`grid size-12 place-items-center rounded-xl border bg-ink-900 text-xl ${feeling===index+1?"border-brand-400":"border-ink-600"}`}>{emoji}</button>)}</div></fieldset>
    <label><span className="label">Notes</span><textarea className="input min-h-24 py-3" value={notes} onChange={(event)=>setNotes(event.target.value)}/></label>{error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300">{error}</p>}<button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : `Log activity · ${load} load`}</button>
  </form>;
}
