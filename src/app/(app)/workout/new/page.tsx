import { WorkoutBuilder, type WorkoutDraft } from "@/components/workout-builder";
import { isSupabaseConfigured, type WorkoutType } from "@/lib/constants";
import { getTemplates } from "@/lib/data";
import { getMembers, requireProfile } from "@/lib/session";
import type { WorkoutStructure } from "@/lib/workout";

export default async function NewWorkoutPage({ searchParams }: { searchParams: Promise<{ date?: string; draft?: string }> }) {
  const { date, draft } = await searchParams;
  if (!isSupabaseConfigured()) return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase before planning workouts</h1></div></div>;
  const [me,members,templates]=await Promise.all([requireProfile(),getMembers(),getTemplates()]);
  const drafts:WorkoutDraft[]=templates.flatMap((template)=>{const item=[...(template.plan_template_items??[])].sort((a,b)=>a.week-b.week||a.day_of_week-b.day_of_week)[0];return item?[{id:template.id,title:item.title??template.name,type:item.type as WorkoutType,structure:item.structure as WorkoutStructure,notes:item.notes??""}]:[]});
  return <div className="py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Plan a session</p><h1 className="mt-1 mb-6 text-3xl font-black">Build workout</h1><WorkoutBuilder date={date} members={members} initialAthleteId={me.id} drafts={drafts} initialDraftId={draft}/></div>;
}
