"use client";

import { useState } from "react";
import { defaultLoadFor, standardFor, STATIONS, type Division } from "@/lib/hyrox";
import { buildHalfSimulation, buildRaceSimulation, describeQuantity, stepTitle, type WorkoutStep, type WorkoutStructure } from "@/lib/workout";

const id = () => crypto.randomUUID();
const STRENGTH_EXERCISES = ["Back Squat", "Front Squat", "Deadlift", "Romanian Deadlift", "Bench Press", "Overhead Press", "Pull-up", "Walking Lunge", "Bulgarian Split Squat", "Box Step-up", "Kettlebell Swing", "Thruster"];
const MODE_DETAILS: Record<WorkoutStep["mode"], { amountLabel: string; unit: string; defaultValue: number }> = {
  distance: { amountLabel: "Distance", unit: "metres", defaultValue: 1000 },
  duration: { amountLabel: "Duration", unit: "minutes", defaultValue: 600 },
  reps: { amountLabel: "Repetitions", unit: "reps", defaultValue: 10 },
  calories: { amountLabel: "Energy", unit: "kcal", defaultValue: 20 },
};

function displayedAmount(step: WorkoutStep) {
  return step.mode === "duration" ? Number((step.value / 60).toFixed(2)) : step.value;
}

export function StructureEditor({ value, onChange, division = "men_open" }: { value: WorkoutStructure; onChange: (value: WorkoutStructure) => void; division?: Division }) {
  const [exercise, setExercise] = useState(STRENGTH_EXERCISES[0]);
  const [customExercise, setCustomExercise] = useState("");

  function updateStep(blockIndex: number, stepIndex: number, patch: Partial<WorkoutStep>) {
    const blocks = structuredClone(value.blocks);
    blocks[blockIndex].steps[stepIndex] = { ...blocks[blockIndex].steps[stepIndex], ...patch };
    onChange({ blocks });
  }

  function changeMode(blockIndex: number, stepIndex: number, mode: WorkoutStep["mode"]) {
    updateStep(blockIndex, stepIndex, { mode, value: MODE_DETAILS[mode].defaultValue });
  }

  function changeAmount(blockIndex: number, stepIndex: number, step: WorkoutStep, rawValue: string) {
    const amount = Number(rawValue);
    updateStep(blockIndex, stepIndex, { value: step.mode === "duration" ? amount * 60 : amount });
  }

  function add(kind: WorkoutStep["kind"], station?: WorkoutStep["station"]) {
    const blocks = value.blocks.length ? structuredClone(value.blocks) : [{ id: id(), rounds: 1, label: "Main set", steps: [] }];
    if (station) {
      const standard = standardFor(division, station);
      blocks.at(-1)!.steps.push({
        id: id(),
        kind: "station",
        station,
        mode: standard.unit === "reps" ? "reps" : "distance",
        value: standard.value,
        loadKg: standard.loadKg,
      });
    } else {
      blocks.at(-1)!.steps.push({
        id: id(),
        kind,
        mode: kind === "rest" ? "duration" : "distance",
        value: kind === "rest" ? 60 : 1000,
      });
    }
    onChange({ blocks });
  }

  function addExercise() {
    const label = exercise === "custom" ? customExercise.trim() : exercise;
    if (!label) return;
    const blocks = value.blocks.length ? structuredClone(value.blocks) : [{ id: id(), rounds: 1, label: "Main set", steps: [] }];
    blocks.at(-1)!.steps.push({ id: id(), kind: "strength", label, mode: "reps", value: 10 });
    onChange({ blocks });
    setCustomExercise("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="chip" onClick={() => onChange(buildHalfSimulation(division))}>½ Half sim</button>
        <button type="button" className="chip" onClick={() => onChange(buildRaceSimulation(division))}>🔥 Full sim</button>
        <button type="button" className="chip" onClick={() => onChange({ blocks: [] })}>Clear</button>
      </div>
      {value.blocks.map((block, blockIndex) => (
        <section key={block.id} className="card">
          <div className="flex gap-2">
            <input className="input" value={block.label ?? ""} aria-label="Block name" onChange={(event) => { const blocks = structuredClone(value.blocks); blocks[blockIndex].label = event.target.value; onChange({ blocks }); }} />
            <label className="w-24 text-sm text-ink-400">Rounds<input className="input mt-1" type="number" min="1" max="99" value={block.rounds} onChange={(event) => { const blocks = structuredClone(value.blocks); blocks[blockIndex].rounds = Number(event.target.value); onChange({ blocks }); }} /></label>
          </div>
          <div className="mt-3 space-y-2">
            {block.steps.map((step, stepIndex) => {
              const detail = MODE_DETAILS[step.mode];
              const showLoad = step.kind === "strength" || Boolean(step.station && defaultLoadFor(division, step.station) !== undefined);
              return (
                <details key={step.id} className="rounded-xl border border-ink-700 bg-ink-900 p-3">
                  <summary className="cursor-pointer font-bold">{stepTitle(step)} <span className="ml-2 font-normal text-ink-400">{describeQuantity(step)}</span></summary>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {step.kind === "strength" && <label className="sm:col-span-4"><span className="label">Exercise name</span><input className="input" value={step.label ?? ""} placeholder="e.g. Back Squat" onChange={(event) => updateStep(blockIndex, stepIndex, { label: event.target.value })} /></label>}
                    <label>
                      <span className="label">Measure</span>
                      <select className="input" value={step.mode} onChange={(event) => changeMode(blockIndex, stepIndex, event.target.value as WorkoutStep["mode"])}>
                        <option value="distance">Distance</option><option value="duration">Duration</option><option value="reps">Reps</option><option value="calories">Calories</option>
                      </select>
                    </label>
                    <label>
                      <span className="label">{detail.amountLabel} ({detail.unit})</span>
                      <input className="input" type="number" min="0" step={step.mode === "duration" ? "0.5" : "1"} value={displayedAmount(step)} onChange={(event) => changeAmount(blockIndex, stepIndex, step, event.target.value)} />
                    </label>
                    {showLoad && <label><span className="label">Load (kg)</span><input className="input" type="number" min="0" step="0.5" value={step.loadKg ?? ""} onChange={(event) => updateStep(blockIndex, stepIndex, { loadKg: event.target.value ? Number(event.target.value) : undefined })} /></label>}
                    {step.kind !== "rest" && <label><span className="label">Rest (sec)</span><input className="input" type="number" min="0" value={step.restSec ?? ""} onChange={(event) => updateStep(blockIndex, stepIndex, { restSec: Number(event.target.value) || undefined })} /></label>}
                    <div className="flex gap-2 sm:col-span-4">
                      <button type="button" className="btn-ghost" disabled={stepIndex === 0} onClick={() => { const blocks = structuredClone(value.blocks); [blocks[blockIndex].steps[stepIndex - 1], blocks[blockIndex].steps[stepIndex]] = [blocks[blockIndex].steps[stepIndex], blocks[blockIndex].steps[stepIndex - 1]]; onChange({ blocks }); }}>↑</button>
                      <button type="button" className="btn-ghost" disabled={stepIndex === block.steps.length - 1} onClick={() => { const blocks = structuredClone(value.blocks); [blocks[blockIndex].steps[stepIndex + 1], blocks[blockIndex].steps[stepIndex]] = [blocks[blockIndex].steps[stepIndex], blocks[blockIndex].steps[stepIndex + 1]]; onChange({ blocks }); }}>↓</button>
                      <button type="button" className="btn-danger ml-auto" onClick={() => { const blocks = structuredClone(value.blocks); blocks[blockIndex].steps.splice(stepIndex, 1); onChange({ blocks }); }}>Remove</button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}
      <div className="card space-y-4">
        <div>
          <span className="label">Add running, rest or a Hyrox station</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" onClick={() => add("run")}>🏃 Run</button>
            <button type="button" className="chip" onClick={() => add("rest")}>⏱ Rest</button>
            {STATIONS.map((station) => <button type="button" className="chip" key={station.id} onClick={() => add("station", station.id)}>{station.emoji} {station.short}</button>)}
          </div>
        </div>
        <div className="border-t border-ink-700 pt-4">
          <span className="label">Add strength exercise</span>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <select className="input" value={exercise} onChange={(event) => setExercise(event.target.value)}>
              <optgroup label="Common exercises">{STRENGTH_EXERCISES.map((item) => <option value={item} key={item}>{item}</option>)}</optgroup>
              <option value="custom">Custom exercise…</option>
            </select>
            <button type="button" className="btn-primary" onClick={addExercise}>＋ Add exercise</button>
          </div>
          {exercise === "custom" && <input className="input mt-2" value={customExercise} onChange={(event) => setCustomExercise(event.target.value)} placeholder="Enter exercise name" />}
        </div>
      </div>
    </div>
  );
}
