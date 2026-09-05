"use client";
import { DecimalInput } from "@/components/decimal-input";

import { useState } from "react";
import { defaultLoadFor, standardFor, STATIONS, type Division } from "@/lib/hyrox";
import {
  buildHalfSimulation,
  buildRaceSimulation,
  describeQuantity,
  estimateStructureSeconds,
  formatDuration,
  stepTitle,
  type WorkoutBlock,
  type WorkoutStep,
  type WorkoutStructure,
} from "@/lib/workout";

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

function emptyBlock(number: number): WorkoutBlock {
  return { id: id(), rounds: 1, label: `Block ${number}`, steps: [] };
}

export function StructureEditor({ value, onChange, division = "men_open" }: { value: WorkoutStructure; onChange: (value: WorkoutStructure) => void; division?: Division }) {
  const [exercise, setExercise] = useState(STRENGTH_EXERCISES[0]);
  const [customExercise, setCustomExercise] = useState("");
  const totalSteps = value.blocks.reduce((total, block) => total + block.steps.length * block.rounds, 0);
  const hasContent = value.blocks.some((block) => block.steps.length > 0);

  function updateBlock(blockIndex: number, patch: Partial<WorkoutBlock>) {
    const blocks = structuredClone(value.blocks);
    blocks[blockIndex] = { ...blocks[blockIndex], ...patch };
    onChange({ blocks });
  }

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

  function addBlock() {
    onChange({ blocks: [...structuredClone(value.blocks), emptyBlock(value.blocks.length + 1)] });
  }

  function moveBlock(blockIndex: number, direction: -1 | 1) {
    const target = blockIndex + direction;
    if (target < 0 || target >= value.blocks.length) return;
    const blocks = structuredClone(value.blocks);
    [blocks[blockIndex], blocks[target]] = [blocks[target], blocks[blockIndex]];
    onChange({ blocks });
  }

  function duplicateBlock(blockIndex: number) {
    const blocks = structuredClone(value.blocks);
    const source = blocks[blockIndex];
    const copy: WorkoutBlock = {
      ...source,
      id: id(),
      label: `${source.label || `Block ${blockIndex + 1}`} copy`,
      steps: source.steps.map((step) => ({ ...step, id: id() })),
    };
    blocks.splice(blockIndex + 1, 0, copy);
    onChange({ blocks });
  }

  function removeBlock(blockIndex: number) {
    const block = value.blocks[blockIndex];
    if (block.steps.length > 0 && !window.confirm(`Remove “${block.label || `Block ${blockIndex + 1}`}” and all of its steps?`)) return;
    const blocks = structuredClone(value.blocks);
    blocks.splice(blockIndex, 1);
    onChange({ blocks });
  }

  function addStep(blockIndex: number, kind: WorkoutStep["kind"], station?: WorkoutStep["station"]) {
    const blocks = structuredClone(value.blocks);
    if (station) {
      const standard = standardFor(division, station);
      blocks[blockIndex].steps.push({
        id: id(),
        kind: "station",
        station,
        mode: standard.unit === "reps" ? "reps" : "distance",
        value: standard.value,
        loadKg: standard.loadKg,
      });
    } else {
      blocks[blockIndex].steps.push({
        id: id(),
        kind,
        mode: kind === "rest" ? "duration" : "distance",
        value: kind === "rest" ? 60 : 1000,
      });
    }
    onChange({ blocks });
  }

  function addExercise(blockIndex: number) {
    const label = exercise === "custom" ? customExercise.trim() : exercise;
    if (!label) return;
    const blocks = structuredClone(value.blocks);
    blocks[blockIndex].steps.push({ id: id(), kind: "strength", label, mode: "reps", value: 10 });
    onChange({ blocks });
    setCustomExercise("");
  }

  function moveStep(blockIndex: number, stepIndex: number, direction: -1 | 1) {
    const target = stepIndex + direction;
    const steps = value.blocks[blockIndex].steps;
    if (target < 0 || target >= steps.length) return;
    const blocks = structuredClone(value.blocks);
    [blocks[blockIndex].steps[stepIndex], blocks[blockIndex].steps[target]] = [blocks[blockIndex].steps[target], blocks[blockIndex].steps[stepIndex]];
    onChange({ blocks });
  }

  function duplicateStep(blockIndex: number, stepIndex: number) {
    const blocks = structuredClone(value.blocks);
    const copy = { ...blocks[blockIndex].steps[stepIndex], id: id() };
    blocks[blockIndex].steps.splice(stepIndex + 1, 0, copy);
    onChange({ blocks });
  }

  function removeStep(blockIndex: number, stepIndex: number) {
    const blocks = structuredClone(value.blocks);
    blocks[blockIndex].steps.splice(stepIndex, 1);
    onChange({ blocks });
  }

  function replaceStructure(next: WorkoutStructure) {
    if (hasContent && !window.confirm("Replace the current workout structure with this preset?")) return;
    onChange(next);
  }

  function clearStructure() {
    if (hasContent && !window.confirm("Clear every block and step from this workout?")) return;
    onChange({ blocks: [] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-4">
        <div>
          <div className="font-black">Workout outline</div>
          <p className="mt-1 text-sm text-ink-400">
            {value.blocks.length} block{value.blocks.length === 1 ? "" : "s"} · {totalSteps} planned step{totalSteps === 1 ? "" : "s"} · {formatDuration(estimateStructureSeconds(value))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={() => replaceStructure(buildHalfSimulation(division))}>½ Half sim</button>
          <button type="button" className="chip" onClick={() => replaceStructure(buildRaceSimulation(division))}>🔥 Full sim</button>
          <button type="button" className="btn-ghost" onClick={addBlock}>＋ Add block</button>
          {value.blocks.length > 0 && <button type="button" className="btn-danger" onClick={clearStructure}>Clear all</button>}
        </div>
      </div>

      {value.blocks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 px-5 py-10 text-center">
          <div className="text-3xl" aria-hidden="true">＋</div>
          <h3 className="mt-3 text-lg font-black">Start with a training block</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-400">Use blocks to group warm-ups, main sets, finishers, or any repeated sequence.</p>
          <button type="button" className="btn-primary mt-5" onClick={addBlock}>Add first block</button>
        </div>
      )}

      {value.blocks.map((block, blockIndex) => (
        <section key={block.id} className="card overflow-hidden p-0">
          <div className="border-b border-ink-700 bg-ink-800/60 p-4">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-400 font-black text-ink-950">{blockIndex + 1}</span>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_7rem]">
                <label>
                  <span className="label">Block name</span>
                  <input className="input" value={block.label ?? ""} onChange={(event) => updateBlock(blockIndex, { label: event.target.value })} placeholder={`Block ${blockIndex + 1}`} />
                </label>
                <label>
                  <span className="label">Rounds</span>
                  <input className="input" type="number" min="1" max="99" value={block.rounds} onChange={(event) => updateBlock(blockIndex, { rounds: Number(event.target.value) })} />
                </label>
              </div>
              <div className="flex flex-wrap gap-1 sm:pt-7">
                <button type="button" className="chip px-3" disabled={blockIndex === 0} onClick={() => moveBlock(blockIndex, -1)} aria-label={`Move ${block.label || `block ${blockIndex + 1}`} up`}>↑</button>
                <button type="button" className="chip px-3" disabled={blockIndex === value.blocks.length - 1} onClick={() => moveBlock(blockIndex, 1)} aria-label={`Move ${block.label || `block ${blockIndex + 1}`} down`}>↓</button>
                <button type="button" className="chip" onClick={() => duplicateBlock(blockIndex)}>Duplicate</button>
                <button type="button" className="chip border-red-800 text-red-300" onClick={() => removeBlock(blockIndex)}>Remove</button>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {block.steps.length === 0 && <p className="rounded-xl bg-ink-900 p-4 text-sm text-ink-400">No steps in this block yet.</p>}
            {block.steps.map((step, stepIndex) => {
              const detail = MODE_DETAILS[step.mode];
              const showLoad = step.kind === "strength" || Boolean(step.station && defaultLoadFor(division, step.station) !== undefined);
              return (
                <details key={step.id} className="group relative rounded-xl border border-ink-700 bg-ink-900 open:border-ink-600">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 pl-3 pr-24 marker:hidden">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink-700 text-sm font-black text-ink-200">{stepIndex + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{stepTitle(step)}</span>
                      <span className="block text-sm text-ink-400">{describeQuantity(step)}{step.loadKg ? ` · ${step.loadKg} kg` : ""}</span>
                    </span>
                    <span className="ml-auto text-ink-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  <button type="button" className="absolute right-2 top-2 rounded-lg border border-red-800 px-2 py-1 text-sm font-bold text-red-300 hover:border-red-600 hover:text-red-200" aria-label={`Remove ${stepTitle(step)}`} onClick={() => removeStep(blockIndex, stepIndex)}>Remove</button>
                  <div className="border-t border-ink-700 p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {step.kind === "strength" && <label className="sm:col-span-2 lg:col-span-4"><span className="label">Exercise name</span><input className="input" value={step.label ?? ""} placeholder="e.g. Back Squat" onChange={(event) => updateStep(blockIndex, stepIndex, { label: event.target.value })} /></label>}
                      <label>
                        <span className="label">Measure</span>
                        <select className="input" value={step.mode} onChange={(event) => changeMode(blockIndex, stepIndex, event.target.value as WorkoutStep["mode"])}>
                          <option value="distance">Distance</option><option value="duration">Duration</option><option value="reps">Reps</option><option value="calories">Calories</option>
                        </select>
                      </label>
                      <label>
                        <span className="label">{detail.amountLabel} ({detail.unit})</span>
                        <DecimalInput className="input" min="0" step={step.mode === "reps" || step.mode === "calories" ? "1" : "any"} value={displayedAmount(step)} onValueChange={(raw) => changeAmount(blockIndex, stepIndex, step, raw)} />
                      </label>
                      {showLoad && <label><span className="label">Load (kg)</span><DecimalInput className="input" min="0" step="0.5" value={step.loadKg ?? ""} onValueChange={(raw) => updateStep(blockIndex, stepIndex, { loadKg: raw ? Number(raw) : undefined })} /></label>}
                      {step.kind !== "rest" && <label><span className="label">Rest (sec)</span><input className="input" type="number" min="0" value={step.restSec ?? ""} onChange={(event) => updateStep(blockIndex, stepIndex, { restSec: Number(event.target.value) || undefined })} /></label>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-700 pt-3">
                      <button type="button" className="btn-ghost" disabled={stepIndex === 0} onClick={() => moveStep(blockIndex, stepIndex, -1)}>↑ Move up</button>
                      <button type="button" className="btn-ghost" disabled={stepIndex === block.steps.length - 1} onClick={() => moveStep(blockIndex, stepIndex, 1)}>↓ Move down</button>
                      <button type="button" className="btn-ghost" onClick={() => duplicateStep(blockIndex, stepIndex)}>Duplicate step</button>
                    </div>
                  </div>
                </details>
              );
            })}

            <details className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40" open={block.steps.length === 0 ? true : undefined}>
              <summary className="cursor-pointer list-none px-4 py-3 font-bold text-brand-400 marker:hidden">＋ Add a step</summary>
              <div className="space-y-4 border-t border-ink-700 p-4">
                <div>
                  <span className="label">Run, rest, or Hyrox station</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="chip" onClick={() => addStep(blockIndex, "run")}>🏃 Run</button>
                    <button type="button" className="chip" onClick={() => addStep(blockIndex, "rest")}>⏱ Rest</button>
                    {STATIONS.map((station) => <button type="button" className="chip" key={station.id} onClick={() => addStep(blockIndex, "station", station.id)}>{station.emoji} {station.short}</button>)}
                  </div>
                </div>
                <div className="border-t border-ink-700 pt-4">
                  <span className="label">Strength exercise</span>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select className="input" value={exercise} onChange={(event) => setExercise(event.target.value)}>
                      <optgroup label="Common exercises">{STRENGTH_EXERCISES.map((item) => <option value={item} key={item}>{item}</option>)}</optgroup>
                      <option value="custom">Custom exercise…</option>
                    </select>
                    <button type="button" className="btn-primary" onClick={() => addExercise(blockIndex)}>＋ Add exercise</button>
                  </div>
                  {exercise === "custom" && <input className="input mt-2" value={customExercise} onChange={(event) => setCustomExercise(event.target.value)} placeholder="Enter exercise name" />}
                </div>
              </div>
            </details>
          </div>
        </section>
      ))}

      {value.blocks.length > 0 && (
        <button type="button" className="min-h-14 w-full rounded-2xl border border-dashed border-ink-600 bg-ink-900/30 font-bold text-ink-200 transition hover:border-brand-400 hover:text-brand-400" onClick={addBlock}>＋ Add another block</button>
      )}
    </div>
  );
}
