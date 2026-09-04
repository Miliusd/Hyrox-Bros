"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DurationInput } from "@/components/duration-input";
import { quickLogActivity } from "@/lib/actions/workouts";
import { WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import { calculateHeartRateLoad, calorieAdjustmentFactor, heartRateIntensity } from "@/lib/load";

const suggestions = ["Basketball", "Football", "Padel", "Swim", "Bike", "Hike", "Climbing", "Skiing"];
const DISTANCE_TYPES: WorkoutType[] = ["run", "erg", "hyrox_sim", "compromised"];
type Member = { id: string; display_name: string; emoji: string; max_hr_bpm: number | null };

export function QuickLogForm({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [athleteId, setAthleteId] = useState(currentUserId);
  const [durationSec, setDurationSec] = useState(45 * 60);
  const [calories, setCalories] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [averageHr, setAverageHr] = useState("");
  const [type, setType] = useState<WorkoutType>("other");
  const [feeling, setFeeling] = useState<number>();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const caloriesValue = calories ? Number(calories) : undefined;
  const selectedMember = members.find((member) => member.id === athleteId) ?? members[0];
  const maxHrBpm = selectedMember?.max_hr_bpm;
  const averageHrBpm = Number(averageHr);
  const validHeartRate = Boolean(maxHrBpm) && averageHrBpm >= 40 && averageHrBpm <= Number(maxHrBpm);
  const baseLoad = validHeartRate ? calculateHeartRateLoad(durationSec, averageHrBpm, Number(maxHrBpm), type) : 0;
  const energyFactor = calorieAdjustmentFactor(durationSec, caloriesValue);
  const load = validHeartRate ? calculateHeartRateLoad(durationSec, averageHrBpm, Number(maxHrBpm), type, caloriesValue) : 0;
  const intensityPercent = validHeartRate ? Math.round(heartRateIntensity(averageHrBpm, Number(maxHrBpm)) * 100) : null;
  const distanceRelevant = DISTANCE_TYPES.includes(type);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!durationSec) {
      setError("Enter a workout duration.");
      return;
    }
    if (!maxHrBpm) {
      setError(`Maximum heart rate is missing for ${selectedMember?.display_name ?? "this athlete"}.`);
      return;
    }
    if (!Number.isInteger(averageHrBpm) || averageHrBpm < 40 || averageHrBpm > maxHrBpm) {
      setError(`Enter average heart rate between 40 and ${maxHrBpm} bpm.`);
      return;
    }
    startTransition(async () => {
      const result = await quickLogActivity({
        athleteId,
        date,
        title,
        type,
        durationSec,
        calories: caloriesValue,
        distanceMeters: distanceRelevant && distanceKm ? Number(distanceKm) * 1000 : undefined,
        averageHrBpm,
        feeling,
        notes,
      });
      if (result.ok && result.id) router.push(`/workout/${result.id}`);
      else setError(result.error ?? "Could not log activity");
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <label>
        <span className="label">Activity</span>
        <input className="input" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What did you do?" />
      </label>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => <button type="button" className="chip" key={item} onClick={() => setTitle(item)}>{item}</button>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label">Date</span><input type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label><span className="label">Who</span><select className="input" value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>{members.map((member) => <option value={member.id} key={member.id}>{member.emoji} {member.display_name}</option>)}</select></label>
      </div>
      <DurationInput value={durationSec} onChange={setDurationSec} />
      <label className="block max-w-xs"><span className="label">Calories burned</span><input className="input" type="number" inputMode="numeric" min="1" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="Optional" /></label>
      <fieldset>
        <legend className="label">Type</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WORKOUT_TYPES).map(([key, meta]) => <button type="button" key={key} onClick={() => setType(key as WorkoutType)} className={`chip ${type === key ? "border-brand-400 bg-brand-400 text-ink-950" : ""}`}>{meta.emoji} {meta.label}</button>)}
        </div>
      </fieldset>
      {distanceRelevant && (
        <label className="block max-w-xs">
          <span className="label">Distance km</span>
          <input className="input" type="number" inputMode="decimal" min="0.01" step="0.01" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} placeholder="Optional" />
        </label>
      )}
      <label className="block max-w-xs">
        <span className="label">Average HR (bpm)</span>
        <input className="input" type="number" inputMode="numeric" min="40" max={maxHrBpm ?? 230} step="1" value={averageHr} onChange={(event) => setAverageHr(event.target.value)} placeholder="Required" required />
        <span className="mt-1 block text-sm text-ink-400">{maxHrBpm ? `Max HR: ${maxHrBpm} bpm${intensityPercent ? ` · ${intensityPercent}%` : ""}` : "Set max HR in this athlete's profile first."}</span>
      </label>
      {caloriesValue && durationSec > 0 && (
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-3 text-sm text-ink-200">
          <div className="font-bold text-white">Load calculation</div>
          <div className="mt-1">Base {baseLoad} × calorie adjustment {energyFactor.toFixed(2)} = <b className="text-brand-400">{load} load</b></div>
          <div className="mt-1 text-ink-400">Calories adjust the estimate by at most 25%.</div>
        </div>
      )}
      <fieldset>
        <legend className="label">Feeling</legend>
        <div className="flex gap-2">{["😫", "🙁", "😐", "🙂", "🤩"].map((emoji, index) => <button type="button" key={emoji} onClick={() => setFeeling(index + 1)} className={`grid size-12 place-items-center rounded-xl border bg-ink-900 text-xl ${feeling === index + 1 ? "border-brand-400" : "border-ink-600"}`}>{emoji}</button>)}</div>
      </fieldset>
      <label><span className="label">Notes</span><textarea className="input min-h-24 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300">{error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : `Log activity · ${load} load`}</button>
    </form>
  );
}
