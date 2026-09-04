import { WorkoutBuilder } from "@/components/workout-builder";
import { isSupabaseConfigured } from "@/lib/constants";
import { getMembers, requireProfile } from "@/lib/session";

export default async function NewWorkoutPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  if (!isSupabaseConfigured()) return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase before planning workouts</h1></div></div>;
  const [me,members]=await Promise.all([requireProfile(),getMembers()]);
  return <div className="py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Plan a session</p><h1 className="mt-1 mb-6 text-3xl font-black">Build workout</h1><WorkoutBuilder date={date} members={members} initialAthleteId={me.id}/></div>;
}
