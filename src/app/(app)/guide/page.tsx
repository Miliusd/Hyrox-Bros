import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/constants";
import { DIVISION_LABELS, STATIONS, standardFor, type Division, type StationId } from "@/lib/hyrox";
import { requireProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Race guide", description: "Your category's HYROX distances, weights, and essential race rules." };

const RULES: Record<StationId, string> = {
  ski_erg: "Complete 1,000 m. The damper starts at 6, but you may adjust it.",
  sled_push: "Complete the full marked distance. Keep the sled inside your lane and cross each line with the whole sled.",
  sled_pull: "Pull the sled through every marked length. Stay in your lane and do not skip a length.",
  burpee_broad_jump: "Chest must touch the floor. Take off and land with both feet; no steps between jumps.",
  row: "Complete 1,000 m. The damper starts at 6, but you may adjust it.",
  farmers_carry: "Carry both kettlebells for the full course and return them upright to the marked area.",
  sandbag_lunges: "Keep the sandbag on your shoulders. The back knee touches the floor and hips and knees finish fully extended.",
  wall_balls: "Squat below parallel, then hit the correct target with the ball. Only valid reps count.",
};

function prescription(division: Division, station: StationId) {
  const standard = standardFor(division, station);
  const work = `${standard.value.toLocaleString("en")} ${standard.unit}`;
  if (station === "sled_push" || station === "sled_pull") return `${work} · ${standard.loadKg} kg incl. sled`;
  if (station === "farmers_carry") return `${work} · 2 × ${standard.loadKg} kg`;
  if (station === "sandbag_lunges") return `${work} · ${standard.loadKg} kg`;
  if (station === "wall_balls") return `${work} · ${standard.loadKg} kg to ${standard.targetM?.toFixed(2)} m`;
  return work;
}

export default async function GuidePage() {
  if (!isSupabaseConfigured()) return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase to see your category guide</h1></div></div>;
  const profile = await requireProfile();
  const division = profile.division as Division;

  return <div className="py-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Race day, at a glance</p><h1 className="mt-1 text-3xl font-black">HYROX guide</h1></div>
      <Link href="/settings" className="btn-ghost">{DIVISION_LABELS[division]} · Change</Link>
    </div>

    <section className="mt-5 overflow-hidden rounded-2xl border border-brand-500 bg-[linear-gradient(135deg,#2c260c,#141821)] p-5 sm:p-6" aria-labelledby="race-format-heading">
      <p className="text-sm font-bold text-brand-400">YOUR CATEGORY</p>
      <h2 id="race-format-heading" className="mt-1 text-2xl font-black">{DIVISION_LABELS[division]}</h2>
      <p className="mt-2 max-w-2xl text-ink-200">Run 1 km, complete the next station, and repeat. That is <b className="text-white">8 × 1 km runs</b>, eight stations, and 8 km of running in total.</p>
      <div className="mt-4 flex flex-wrap gap-2"><span className="chip">8 km running</span><span className="chip">8 stations</span><span className="chip">Fixed order</span></div>
    </section>

    <section className="mt-5" aria-labelledby="stations-heading">
      <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-ink-400">After each 1 km run</p><h2 id="stations-heading" className="mt-1 text-2xl font-black">Stations in order</h2></div></div>
      <ol className="mt-3 grid gap-3 md:grid-cols-2">
        {STATIONS.map((station, index) => <li className="card flex gap-4" key={station.id}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-400 font-black text-ink-950" aria-hidden="true">{index + 1}</span>
          <div className="min-w-0"><div className="flex items-center gap-2"><span aria-hidden="true">{station.emoji}</span><h3 className="font-black">{station.name}</h3></div><p className="mt-1 font-bold text-brand-400">{prescription(division, station.id)}</p><p className="mt-2 text-sm leading-relaxed text-ink-400">{RULES[station.id]}</p></div>
        </li>)}
      </ol>
    </section>

    <section className="card mt-5" aria-labelledby="essentials-heading">
      <h2 id="essentials-heading" className="text-xl font-black">Race essentials</h2>
      <ul className="mt-3 grid gap-3 text-sm leading-relaxed text-ink-200 sm:grid-cols-2">
        <li><b className="text-white">Follow the marked course.</b> Complete every run lap, station, distance, and repetition in the prescribed order.</li>
        <li><b className="text-white">Listen to judges.</b> Correct a movement when called; invalid reps and missed distances can add penalties.</li>
        <li><b className="text-white">Use your category setup.</b> Check the lane, implement weight, and wall-ball target before starting.</li>
        <li><b className="text-white">Check your event guide.</b> Venue layouts and race-day instructions can vary by event.</li>
      </ul>
    </section>

    <aside className="mt-4 rounded-xl border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-ink-400">This is a quick reference, not a replacement for the official rules. Standards were checked against HYROX&apos;s published Singles rules and race overview. Before racing, confirm the latest <a className="font-bold text-brand-400 underline underline-offset-4" href="https://hyrox.com/rulebook/" target="_blank" rel="noreferrer">official rulebook</a> and your event&apos;s Athlete Guide.</aside>
  </div>;
}
