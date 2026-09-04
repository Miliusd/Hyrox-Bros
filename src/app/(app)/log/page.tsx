import { QuickLogForm } from "@/components/quick-log-form";
import { isSupabaseConfigured } from "@/lib/constants";
import { getMembers, requireProfile } from "@/lib/session";

export default async function LogPage() {
  if (!isSupabaseConfigured()) return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase before logging activities</h1></div></div>;
  const [me, members] = await Promise.all([requireProfile(), getMembers()]);
  return <div className="mx-auto max-w-2xl py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">No plan needed</p><h1 className="mt-1 mb-6 text-3xl font-black">Quick log</h1><div className="card"><QuickLogForm members={members} currentUserId={me.id}/></div></div>;
}
