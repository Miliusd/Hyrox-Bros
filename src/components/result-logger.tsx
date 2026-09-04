"use client";

import { useState, useTransition } from "react";
import { logResult } from "@/lib/actions/workouts";
import type { WorkoutType } from "@/lib/constants";
import { calculateHeartRateLoad, heartRateIntensity } from "@/lib/load";
import { formatDuration, parseDuration, type WorkoutStructure } from "@/lib/workout";

type ActualStrength = { load: string; reps: string };
export type StrengthResultInput = { stepId: string; round: number; exercise: string; actualLoadKg: number; actualReps: number };
export type ExistingWorkoutResult = {
  durationSec: number;
  calories: number | null;
  distanceMeters: number | null;
  averageHrBpm: number | null;
  load: number;
  feeling: number | null;
  notes: string;
  stepResults: StrengthResultInput[];
};

const DISTANCE_TYPES: WorkoutType[] = ["run", "erg", "hyrox_sim", "compromised"];

function initialStrengthValues(result?: ExistingWorkoutResult) {
  const values: Record<string, ActualStrength> = {};
  for (const step of result?.stepResults ?? []) {
    values[step.stepId] = { load: String(step.actualLoadKg), reps: String(step.actualReps) };
  }
  return values;
}

export function ResultLogger({
  workoutId,
  type,
  structure,
  maxHrBpm,
  initialResult,
  initialDurationSec,
}: {
  workoutId: string;
  type: WorkoutType;
  structure: WorkoutStructure;
  maxHrBpm: number | null;
  initialResult?: ExistingWorkoutResult;
  initialDurationSec?: number;
}) {
  const [duration, setDuration] = useState(initialResult ? formatDuration(initialResult.durationSec) : initialDurationSec ? formatDuration(initialDurationSec) : "");
  const [calories, setCalories] = useState(initialResult?.calories?.toString() ?? "");
  const [distanceKm, setDistanceKm] = useState(initialResult?.distanceMeters ? String(Number((initialResult.distanceMeters / 1000).toFixed(2))) : "");
  const [averageHr, setAverageHr] = useState(initialResult?.averageHrBpm?.toString() ?? "");
  const [actualStrength, setActualStrength] = useState<Record<string, ActualStrength>>(() => initialStrengthValues(initialResult));
  const [feeling, setFeeling] = useState<number | null>(initialResult?.feeling ?? null);
  const [notes, setNotes] = useState(initialResult?.notes ?? "");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const seconds = parseDuration(duration) ?? 0;
  const averageHrBpm = Number(averageHr);
  const caloriesValue = calories ? Number(calories) : undefined;
  const canCalculate = seconds > 0 && Boolean(maxHrBpm) && averageHrBpm >= 40 && averageHrBpm <= Number(maxHrBpm);
  const load = canCalculate
    ? calculateHeartRateLoad(seconds, averageHrBpm, Number(maxHrBpm), type, caloriesValue)
    : initialResult?.load ?? 0;
  const intensityPercent = canCalculate ? Math.round(heartRateIntensity(averageHrBpm, Number(maxHrBpm)) * 100) : null;
  const distanceRelevant = DISTANCE_TYPES.includes(type);
  const strengthSteps = structure.blocks.flatMap((block) => block.steps).filter((step) => step.kind === "strength");

  function updateStrength(stepId: string, field: keyof ActualStrength, value: string) {
    setActualStrength((current) => ({
      ...current,
      [stepId]: { load: current[stepId]?.load ?? "", reps: current[stepId]?.reps ?? "", [field]: value },
    }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!seconds) {
      setSaved(false);
      setMessage("Enter a valid total time.");
      return;
    }
    if (!maxHrBpm) {
      setSaved(false);
      setMessage("Maximum heart rate is missing from this athlete's profile.");
      return;
    }
    if (!Number.isInteger(averageHrBpm) || averageHrBpm < 40 || averageHrBpm > maxHrBpm) {
      setSaved(false);
      setMessage(`Enter average heart rate between 40 and ${maxHrBpm} bpm.`);
      return;
    }

    const stepResults: StrengthResultInput[] = [];
    for (const step of strengthSteps) {
      const actual = actualStrength[step.id];
      if (!actual?.load && !actual?.reps) continue;
      const actualLoadKg = Number(actual.load);
      const actualReps = Number(actual.reps);
      if (!(actualLoadKg > 0) || !Number.isInteger(actualReps) || actualReps < 1) {
        setSaved(false);
        setMessage(`Enter both kg and whole-number reps for ${step.label ?? "strength exercise"}.`);
        return;
      }
      stepResults.push({ stepId: step.id, round: 1, exercise: step.label ?? "Strength exercise", actualLoadKg, actualReps });
    }

    setMessage("");
    startTransition(async () => {
      const result = await logResult({
        workoutId,
        durationSec: seconds,
        calories: caloriesValue,
        distanceMeters: distanceKm ? Number(distanceKm) * 1000 : undefined,
        averageHrBpm,
        feeling,
        notes,
        stepResults,
      });
      if (result.ok) {
        setSaved(true);
        const pbText = result.newPbs?.length ? ` New PB: ${result.newPbs.join(", ")}.` : "";
        setMessage(`${initialResult ? "Result updated." : "Workout completed."}${pbText}${result.warning ? ` ${result.warning}` : ""}`);
      } else {
        setSaved(false);
        setMessage(result.error ?? "Could not save result");
      }
    });
  }

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <div>
        <h2 className="text-xl font-black">{initialResult ? "Recorded result" : "Log the result"}</h2>
        <p className="mt-1 text-sm text-ink-400">{initialResult ? "Review or correct what was recorded." : "Record what you actually completed."}</p>
      </div>
      {!maxHrBpm && <p className="rounded-xl border border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">Set this athlete&apos;s maximum heart rate in their profile before saving a result.</p>}
      <div className={`grid gap-3 ${distanceRelevant ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <label><span className="label">Total time</span><input className="input" inputMode="text" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="mm:ss" required /></label>
        <label><span className="label">Calories</span><input className="input" type="number" inputMode="numeric" min="1" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="Optional" /></label>
        <label>
          <span className="label">Average HR (bpm)</span>
          <input className="input" type="number" inputMode="numeric" min="40" max={maxHrBpm ?? 230} step="1" value={averageHr} onChange={(event) => setAverageHr(event.target.value)} placeholder="Required" required />
          {maxHrBpm && <span className="mt-1 block text-sm text-ink-400">Max HR: {maxHrBpm} bpm{intensityPercent ? ` · ${intensityPercent}%` : ""}</span>}
        </label>
        {distanceRelevant && <label><span className="label">Distance km</span><input className="input" type="number" inputMode="decimal" min="0.01" step="0.01" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} placeholder="Optional" /></label>}
      </div>
      {strengthSteps.length > 0 && (
        <fieldset className="rounded-xl border border-ink-700 bg-ink-900 p-3">
          <legend className="px-1 font-black">Actual strength work</legend>
          <p className="mb-3 text-sm text-ink-400">Enter the heaviest completed set for each exercise. A heavier load than your previous best becomes a PB automatically.</p>
          <div className="space-y-3">
            {strengthSteps.map((step) => (
              <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-end gap-2" key={step.id}>
                <div className="pb-3 font-bold">{step.label ?? "Strength exercise"}</div>
                <label><span className="label">Load kg</span><input className="input" type="number" inputMode="decimal" min="0.5" step="0.5" value={actualStrength[step.id]?.load ?? ""} onChange={(event) => updateStrength(step.id, "load", event.target.value)} placeholder={step.loadKg?.toString() ?? "kg"} /></label>
                <label><span className="label">Reps</span><input className="input" type="number" inputMode="numeric" min="1" step="1" value={actualStrength[step.id]?.reps ?? ""} onChange={(event) => updateStrength(step.id, "reps", event.target.value)} placeholder={step.mode === "reps" ? step.value.toString() : "reps"} /></label>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      <div className="rounded-xl bg-brand-400 p-3 text-center text-ink-950"><div className="text-sm font-bold">Heart-rate training load</div><div className="text-2xl font-black">{load}</div></div>
      <div className="flex gap-2">
        {["😫", "🙁", "😐", "🙂", "🤩"].map((emoji, index) => <button type="button" key={emoji} onClick={() => setFeeling(index + 1)} className={`grid size-11 place-items-center rounded-xl border bg-ink-900 ${feeling === index + 1 ? "border-brand-400" : "border-ink-600"}`}>{emoji}</button>)}
      </div>
      <textarea className="input min-h-20 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How did it go?" />
      {message && <p className={saved ? "text-emerald-300" : "text-red-300"} role="status">{message}</p>}
      <button className="btn-primary w-full" disabled={pending || !seconds || !maxHrBpm}>{pending ? "Saving…" : initialResult ? "Save result changes" : "Mark complete"}</button>
    </form>
  );
}
