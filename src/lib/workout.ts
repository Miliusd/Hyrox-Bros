import { DEFAULT_THRESHOLD_PACE } from "./constants";
import { defaultLoadFor, raceValueFor, STATIONS, type Division, type StationId } from "./hyrox";

export type WorkoutStep = { id: string; kind: "run" | "station" | "strength" | "rest" | "other"; station?: StationId; label?: string; mode: "distance" | "duration" | "reps" | "calories"; value: number; loadKg?: number; rpe?: number; restSec?: number; notes?: string };
export type WorkoutBlock = { id: string; rounds: number; label?: string; steps: WorkoutStep[] };
export type WorkoutStructure = { blocks: WorkoutBlock[] };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function estimateStepSeconds(step: WorkoutStep, thresholdPaceSecPerKm = DEFAULT_THRESHOLD_PACE) {
  let seconds = 0;
  if (step.mode === "duration") seconds = step.value;
  else if (step.kind === "run" && step.mode === "distance") seconds = (step.value / 1000) * thresholdPaceSecPerKm / clamp((step.rpe ?? 8) / 8, 0.6, 1.15);
  else if (step.kind === "station" && step.station) {
    const station = STATIONS.find((item) => item.id === step.station)!;
    seconds = station.benchmarkSec * (step.value / raceValueFor("men_open", step.station));
  } else if (step.mode === "reps") seconds = step.value * 3;
  else if (step.mode === "calories") seconds = step.value * 4;
  return seconds + (step.restSec ?? 0);
}

export function estimateStructureSeconds(structure: WorkoutStructure, pace = DEFAULT_THRESHOLD_PACE) {
  return structure.blocks.reduce((total, block) => total + block.rounds * block.steps.reduce((sum, step) => sum + estimateStepSeconds(step, pace), 0), 0);
}

export function structureAverageRpe(structure: WorkoutStructure, pace = DEFAULT_THRESHOLD_PACE) {
  let weighted = 0; let seconds = 0;
  for (const block of structure.blocks) for (let round = 0; round < block.rounds; round += 1) for (const step of block.steps) {
    if (step.kind === "rest" || !step.rpe) continue;
    const duration = estimateStepSeconds({ ...step, restSec: 0 }, pace);
    weighted += duration * step.rpe; seconds += duration;
  }
  return seconds ? weighted / seconds : 5;
}

export function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds)); const h = Math.floor(whole / 3600); const m = Math.floor((whole % 3600) / 60); const s = whole % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function parseDuration(value: string) {
  const parts = value.trim().replace(/[.,]/g, ":").split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0) || parts.length > 3) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function formatPace(secondsPerKm: number) { const seconds = Math.round(secondsPerKm); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
export function parsePace(value: string) { const match = value.trim().replace(/[.,]/g, ":").match(/^(\d{1,2}):([0-5]\d)$/); if (!match) return null; const seconds = Number(match[1]) * 60 + Number(match[2]); return seconds >= 120 && seconds <= 900 ? seconds : null; }

export function describeQuantity(step: WorkoutStep) { return step.mode === "duration" ? formatDuration(step.value) : `${step.value} ${step.mode === "distance" ? "m" : step.mode}`; }
export function stepTitle(step: WorkoutStep) { return step.label || (step.station ? STATIONS.find((item) => item.id === step.station)?.name : step.kind[0].toUpperCase() + step.kind.slice(1)) || "Step"; }
export function flattenSteps(structure: WorkoutStructure) { return structure.blocks.flatMap((block) => Array.from({ length: block.rounds }, (_, round) => block.steps.map((step) => ({ ...step, round: round + 1, blockId: block.id }))).flat()); }
export function summariseStructure(structure: WorkoutStructure) { const steps = flattenSteps(structure); return `${steps.length} steps · ${formatDuration(estimateStructureSeconds(structure))}`; }

function simulation(division: Division, count: number): WorkoutStructure {
  const steps: WorkoutStep[] = STATIONS.slice(0, count).flatMap((station, index) => [
    { id: `run-${index + 1}`, kind: "run", label: `Run ${index + 1}`, mode: "distance", value: 1000, rpe: 8 } as WorkoutStep,
    { id: station.id, kind: "station", station: station.id, mode: station.unit === "reps" ? "reps" : "distance", value: raceValueFor(division, station.id), loadKg: defaultLoadFor(division, station.id), rpe: 9 } as WorkoutStep,
  ]);
  return { blocks: [{ id: "race", rounds: 1, label: count === 8 ? "Full race" : "Half race", steps }] };
}
export const buildRaceSimulation = (division: Division) => simulation(division, 8);
export const buildHalfSimulation = (division: Division) => simulation(division, 4);
