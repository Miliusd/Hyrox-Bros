import Link from "next/link";
import { format, subDays } from "date-fns";
import { AthletePicker } from "@/components/athlete-picker";
import { FitnessChart } from "@/components/fitness-chart";
import { LoadExplainer } from "@/components/load-explainer";
import { isSupabaseConfigured, WORKOUT_TYPES, type WorkoutType } from "@/lib/constants";
import { getFitnessRows } from "@/lib/data";
import { buildFitnessSeries, formBand, rampRate } from "@/lib/load";
import { getMembers, requireProfile } from "@/lib/session";

export default async function FitnessPage({ searchParams }: { searchParams: Promise<{ athlete?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupNotice/>;
  const params = await searchParams; const me = await requireProfile(); const members = await getMembers();
  const athleteId = members.some((member) => member.id === params.athlete) ? params.athlete! : me.id;
  const end = new Date(); const start = subDays(end, 89); const dates = Array.from({ length: 90 }, (_, index) => format(subDays(end, 89 - index), "yyyy-MM-dd"));
  const rows = await getFitnessRows(athleteId, format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  const dailyLoad: Record<string, number> = {}; for (const row of rows) dailyLoad[row.date] = (dailyLoad[row.date] ?? 0) + Number(row.load);
  const series = buildFitnessSeries(dates, dailyLoad); const last = series.at(-1)!; const band = formBand(last.form);
  const thisWeek = dates.slice(-7).reduce((sum, date) => sum + (dailyLoad[date] ?? 0), 0); const lastWeek = dates.slice(-14, -7).reduce((sum, date) => sum + (dailyLoad[date] ?? 0), 0); const ramp = rampRate(thisWeek, lastWeek);
  const split = rows.reduce<Record<string, number>>((totals, row) => { const relation = row.workouts as unknown; const workout = Array.isArray(relation) ? relation[0] : relation; const type = typeof workout === "object" && workout && "type" in workout ? String(workout.type) : "other"; totals[type] = (totals[type] ?? 0) + Number(row.load); return totals; }, {}); const splitTotal = Math.max(1, Object.values(split).reduce((sum, load) => sum + load, 0));
  return <div className="py-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Training state</p><h1 className="mt-1 text-3xl font-black">Fitness</h1></div><div className="flex flex-wrap gap-2"><Link href="/log" className="btn-primary">＋ Log activity</Link><AthletePicker value={athleteId} athletes={members} path="/fitness" includeCrew={false}/></div></div>
    <div className="mt-5 grid grid-cols-3 gap-3">{[["Fitness", last.fitness, "text-brand-400"], ["Fatigue", last.fatigue, "text-red-400"], ["Form", last.form, "text-sky-400"]].map(([label, value, colour]) => <div className="card" key={String(label)}><div className="text-sm text-ink-400">{label}</div><div className={`mt-1 text-3xl font-black ${colour}`}>{Math.round(Number(value))}</div></div>)}</div>
    <div className="mt-4 rounded-xl border p-4" style={{ borderColor: band.colour, background: `${band.colour}12` }}><b style={{ color: band.colour }}>{band.label}</b><span className="ml-2 text-ink-200">{band.hint}</span></div>
    <section className="card mt-4"><div className="flex flex-wrap gap-4 text-sm"><span><i className="mr-2 inline-block size-2 rounded-full bg-brand-400"/>Fitness</span><span><i className="mr-2 inline-block size-2 rounded-full bg-red-500"/>Fatigue</span><span><i className="mr-2 inline-block size-2 rounded-full bg-sky-400"/>Form</span><span><i className="mr-2 inline-block size-2 rounded-sm bg-ink-600"/>Daily load</span></div>{rows.length ? <FitnessChart data={series}/> : <div className="grid h-64 place-items-center text-center text-ink-400"><div><div className="text-3xl">⌁</div><p className="mt-2">Log your first activity to start the chart.</p></div></div>}</section>
    <section className="mt-4 grid gap-4 md:grid-cols-2"><div className="card"><h2 className="font-black">Last 7 days</h2><div className="mt-4 flex items-end gap-3"><b className="text-4xl">{thisWeek}</b><span className="pb-1 text-ink-400">load</span></div><p className={`mt-2 text-sm ${ramp > 15 ? "text-amber-300" : "text-ink-400"}`}>{lastWeek} previous week · {ramp >= 0 ? "+" : ""}{Math.round(ramp)}% ramp{ramp > 15 ? " — above 15%" : ""}</p></div><div className="card"><h2 className="font-black">Training split</h2>{Object.keys(split).length ? <div className="mt-4 space-y-3">{Object.entries(split).sort((a,b)=>b[1]-a[1]).map(([type, load]) => { const meta = WORKOUT_TYPES[type as WorkoutType] ?? WORKOUT_TYPES.other; const width = Math.round(load / splitTotal * 100); return <div key={type}><div className="mb-1 flex justify-between text-sm"><span>{meta.emoji} {meta.label}</span><span>{width}%</span></div><div className="h-2 rounded bg-ink-700"><div className="h-2 rounded" style={{ width: `${width}%`, background: meta.colour }}/></div></div>; })}</div> : <p className="mt-4 text-sm text-ink-400">No completed training yet.</p>}</div></section><div className="mt-4"><LoadExplainer/></div>
  </div>;
}

function SetupNotice(){return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Fitness will appear after Supabase is connected</h1><p className="mt-2 text-ink-400">No sample history is shown.</p></div></div>}
