import { DraftBuilder } from "@/components/draft-builder";
import { isSupabaseConfigured } from "@/lib/constants";
import { requireProfile } from "@/lib/session";

export default async function NewDraftPage(){
  if(!isSupabaseConfigured())return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase to create drafts</h1></div></div>;
  const me=await requireProfile();
  return <div className="py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Reusable workout</p><h1 className="mt-1 mb-2 text-3xl font-black">Create training draft</h1><p className="mb-6 text-ink-400">Build it once. You can choose this draft whenever you add a workout to the calendar.</p><DraftBuilder division={me.division}/></div>;
}
