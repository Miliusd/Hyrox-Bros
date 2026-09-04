import Link from "next/link";
import { addDays, format, isValid, parseISO, startOfWeek } from "date-fns";
import { AthletePicker } from "@/components/athlete-picker";
import { WorkoutCard } from "@/components/workout-card";
import { ALL_ATHLETES, isSupabaseConfigured, type WorkoutType } from "@/lib/constants";
import { getCrewLoads, getWeekWorkouts, getWeekWorkoutsForCrew } from "@/lib/data";
import { getMembers, requireProfile } from "@/lib/session";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string; athlete?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const params = await searchParams;
  const me = await requireProfile();
  const members = await getMembers();
  const parsedWeek = params.week ? parseISO(params.week) : new Date();
  const monday = startOfWeek(isValid(parsedWeek) ? parsedWeek : new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const start = format(monday, "yyyy-MM-dd"); const end = format(days[6], "yyyy-MM-dd");
  const requestedAthlete = params.athlete ?? ALL_ATHLETES;
  const athlete = requestedAthlete === ALL_ATHLETES || members.some((member) => member.id === requestedAthlete) ? requestedAthlete : me.id;
  const [workouts, crewResults] = await Promise.all([athlete === ALL_ATHLETES ? getWeekWorkoutsForCrew(start, end) : getWeekWorkouts(athlete, start, end), getCrewLoads(start, end)]);
  const results = workouts.flatMap((workout) => workout.workout_results ?? []);
  const actualLoad = results.reduce((total, result) => total + Number(result.load ?? 0), 0);
  const trainedSeconds = results.reduce((total, result) => total + Number(result.duration_sec ?? 0), 0);
  const crewTotals = members.map((member) => ({ ...member, load: crewResults.filter((result) => result.athlete_id === member.id).reduce((sum, result) => sum + Number(result.load), 0) })).sort((a, b) => b.load - a.load);
  const crewMax = Math.max(1, ...crewTotals.map((member) => member.load));

  return <div className="py-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Training week</p><h1 className="mt-1 text-3xl font-black tracking-tight">{format(monday, "d MMM")} — {format(days[6], "d MMM")}</h1></div><div className="flex gap-2"><Link href="/workout/new" className="btn-ghost">Plan workout</Link><Link href="/log" className="btn-primary">＋ Log activity</Link></div></div>
    <div className="mt-5 flex flex-wrap gap-2"><Link href={`/?week=${format(addDays(monday, -7), "yyyy-MM-dd")}&athlete=${athlete}`} className="btn-ghost">← Prev</Link><Link href={`/?athlete=${athlete}`} className="btn-ghost">Today</Link><Link href={`/?week=${format(addDays(monday, 7), "yyyy-MM-dd")}&athlete=${athlete}`} className="btn-ghost">Next →</Link><AthletePicker value={athlete} week={start} athletes={members} /></div>
    <section className="mt-5 grid gap-3 md:grid-cols-3"><Metric label="Actual load" value={actualLoad} accent/><Metric label="Completed sessions" value={`${results.length} / ${workouts.length}`}/><Metric label="Time trained" value={`${Math.floor(trainedSeconds / 3600) ? `${Math.floor(trainedSeconds / 3600)}h ` : ""}${Math.round((trainedSeconds % 3600) / 60)}m`}/></section>
    <section className="card mt-4"><div className="flex items-center justify-between"><h2 className="font-black">Crew this week</h2><span className="text-sm text-ink-400">completed load</span></div>{crewTotals.some((member) => member.load > 0) ? <div className="mt-4 space-y-3">{crewTotals.map((member) => <Link href={`/?week=${start}&athlete=${member.id}`} key={member.id} className={`grid grid-cols-[7rem_1fr_2rem] items-center gap-3 rounded-lg p-1 text-sm ${athlete === member.id ? "bg-brand-400/10 text-brand-400" : ""}`}><span className="truncate">{member.emoji} {member.display_name}</span><div className="h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-brand-400" style={{ width: `${member.load / crewMax * 100}%` }}/></div><b>{member.load}</b></Link>)}</div> : <p className="mt-4 text-sm text-ink-400">No completed sessions this week yet.</p>}</section>
    <section className="mt-4 grid gap-3 md:grid-cols-2">{days.map((day) => { const date = format(day, "yyyy-MM-dd"); const sessions = workouts.filter((workout) => workout.date === date); const today = date === format(new Date(), "yyyy-MM-dd"); return <article key={date} className={`card min-h-40 ${today ? "border-brand-500 ring-1 ring-brand-500/30" : ""}`}><div className="flex items-center justify-between"><div><span className="text-sm font-bold uppercase tracking-wider text-ink-400">{format(day, "EEE")}</span><h2 className="text-xl font-black">{format(day, "d MMM")}{today && <span className="ml-2 text-xs text-brand-400">TODAY</span>}</h2></div><Link href={`/workout/new?date=${date}`} className="chip">＋ Add</Link></div><div className="mt-4 space-y-2">{sessions.length ? sessions.map((workout) => { const result = workout.workout_results?.[0]; return <WorkoutCard key={workout.id} crew={athlete === ALL_ATHLETES} workout={{ id: workout.id, title: workout.title, type: workout.type as WorkoutType, planned_duration_sec: workout.planned_duration_sec, status: workout.status, result: result ? { duration_sec: Number(result.duration_sec), load: Number(result.load) } : null, athlete: workout.athlete ?? undefined }}/>; }) : <p className="py-4 text-sm text-ink-400">Rest day</p>}</div></article>; })}</section>
  </div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) { return <div className="card"><div className="text-sm text-ink-400">{label}</div><div className={`mt-1 text-3xl font-black ${accent ? "text-brand-400" : ""}`}>{value}</div></div>; }
function SetupNotice() { return <div className="py-12"><div className="card mx-auto max-w-xl text-center"><div className="text-4xl">🔐</div><h1 className="mt-3 text-2xl font-black">Connect Supabase to begin</h1><p className="mt-2 text-ink-400">The demo data has been removed. Add the Supabase environment variables and your five allowlisted usernames to start with a clean shared calendar.</p></div></div>; }
