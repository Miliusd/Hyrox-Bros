export const ALL_ATHLETES = "all";
export const DEFAULT_THRESHOLD_PACE = 270;
export const isSupabaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const WORKOUT_TYPES = {
  run: { label: "Run", emoji: "🏃", colour: "#38bdf8", factor: 1 },
  erg: { label: "Erg", emoji: "🚣", colour: "#22d3ee", factor: 1 },
  strength: { label: "Strength", emoji: "🏋️", colour: "#f97316", factor: 0.85 },
  hyrox_sim: { label: "Hyrox Sim", emoji: "🔥", colour: "#ef4444", factor: 1.1 },
  compromised: { label: "Compromised", emoji: "⚡", colour: "#a855f7", factor: 1.05 },
  recovery: { label: "Recovery", emoji: "🧘", colour: "#4ade80", factor: 0.5 },
  other: { label: "Other", emoji: "📋", colour: "#94a3b8", factor: 1 },
} as const;

export type WorkoutType = keyof typeof WORKOUT_TYPES;
