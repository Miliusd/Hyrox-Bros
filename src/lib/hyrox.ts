export const STATIONS = [
  { id: "ski_erg", name: "SkiErg", short: "Ski", emoji: "🎿", value: 1000, unit: "m", benchmarkSec: 260 },
  { id: "sled_push", name: "Sled Push", short: "Push", emoji: "🛷", value: 50, unit: "m", benchmarkSec: 180 },
  { id: "sled_pull", name: "Sled Pull", short: "Pull", emoji: "🪢", value: 50, unit: "m", benchmarkSec: 240 },
  { id: "burpee_broad_jump", name: "Burpee Broad Jumps", short: "BBJ", emoji: "🤸", value: 80, unit: "m", benchmarkSec: 300 },
  { id: "row", name: "Rowing", short: "Row", emoji: "🚣", value: 1000, unit: "m", benchmarkSec: 250 },
  { id: "farmers_carry", name: "Farmers Carry", short: "Farmers", emoji: "🧳", value: 200, unit: "m", benchmarkSec: 130 },
  { id: "sandbag_lunges", name: "Sandbag Lunges", short: "Lunges", emoji: "🎒", value: 100, unit: "m", benchmarkSec: 240 },
  { id: "wall_balls", name: "Wall Balls", short: "WB", emoji: "🏐", value: 100, unit: "reps", benchmarkSec: 330 },
] as const;

export type StationId = (typeof STATIONS)[number]["id"];
export type Division = "men_open" | "women_open" | "men_pro" | "women_pro";

export const DIVISION_LABELS: Record<Division, string> = {
  men_open: "Men Open",
  women_open: "Women Open",
  men_pro: "Men Pro",
  women_pro: "Women Pro",
};

const LOADS: Record<Division, Partial<Record<StationId, number>>> = {
  men_open: { sled_push: 152, sled_pull: 103, farmers_carry: 24, sandbag_lunges: 20, wall_balls: 6 },
  women_open: { sled_push: 102, sled_pull: 78, farmers_carry: 16, sandbag_lunges: 10, wall_balls: 4 },
  men_pro: { sled_push: 202, sled_pull: 153, farmers_carry: 32, sandbag_lunges: 30, wall_balls: 9 },
  women_pro: { sled_push: 152, sled_pull: 103, farmers_carry: 24, sandbag_lunges: 20, wall_balls: 6 },
};

export function standardFor(division: Division, station: StationId) {
  const item = STATIONS.find((candidate) => candidate.id === station)!;
  const loadKg = LOADS[division][station];
  const targetM = station === "wall_balls" ? (division.includes("women") ? 2.7 : 3) : undefined;
  return { ...item, value: raceValueFor(division, station), loadKg, targetM };
}

export function raceValueFor(_division: Division, station: StationId) {
  return STATIONS.find((item) => item.id === station)!.value;
}

export function defaultLoadFor(division: Division, station: StationId) {
  return LOADS[division][station];
}
