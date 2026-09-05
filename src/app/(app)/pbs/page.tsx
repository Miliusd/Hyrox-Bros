import { PbForm } from "@/components/pb-form";
import { isSupabaseConfigured } from "@/lib/constants";
import { getStationResults } from "@/lib/data";
import { requireProfile } from "@/lib/session";
import { formatDuration } from "@/lib/workout";

function testName(station: unknown) {
  return String(station).replace(/^strength_/, "").replaceAll("_", " ");
}

export default async function PbsPage() {
  if (!isSupabaseConfigured()) {
    return <div className="py-12"><div className="card text-center"><h1 className="text-2xl font-black">Connect Supabase to record PBs</h1></div></div>;
  }
  const me = await requireProfile();
  const results = await getStationResults();

  return (
    <div className="py-6">
      <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Benchmarks</p>
      <h1 className="mt-1 text-3xl font-black">Personal bests</h1>
      <div className="mt-5 grid gap-4 lg:grid-cols-[22rem_1fr]">
        <PbForm athleteId={me.id} />
        <section className="card overflow-x-auto">
          {results.length ? (
            <table className="w-full min-w-[32rem] text-left">
              <caption className="sr-only">Personal best results by athlete, test, result, and date</caption>
              <thead className="text-sm text-ink-400">
                <tr><th className="pb-3">Athlete</th><th className="pb-3">Test</th><th className="pb-3">Result</th><th className="pb-3">Date</th></tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr className="border-t border-ink-700" key={row.id}>
                    <td className="py-4 font-bold">{row.profiles?.emoji} {row.profiles?.display_name}</td>
                    <td className="py-4 capitalize">{testName(row.station)}</td>
                    <td className="py-4">
                      <span className="text-brand-400">
                        {row.metric === "time_sec" ? formatDuration(Number(row.value)) : row.value}
                        {row.metric === "max_kg" ? " kg" : row.metric === "reps" ? " reps" : ""}
                      </span>
                      {row.notes && <span className="ml-2 text-sm text-ink-400">· {row.notes}</span>}
                    </td>
                    <td className="py-4 text-ink-400">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="grid min-h-60 place-items-center text-center text-ink-400"><p>No benchmarks yet. Log the first one.</p></div>}
        </section>
      </div>
    </div>
  );
}
