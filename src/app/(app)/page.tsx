import Link from "next/link";
import { addDays, format, isValid, parseISO, startOfWeek } from "date-fns";
import { AthletePicker } from "@/components/athlete-picker";
import { WorkoutCard, type WorkoutCardData } from "@/components/workout-card";
import { ALL_ATHLETES, isSupabaseConfigured, type WorkoutType } from "@/lib/constants";
import { getCrewLoads, getWeekWorkouts, getWeekWorkoutsForCrew } from "@/lib/data";
import { getMembers, requireProfile } from "@/lib/session";

type CalendarWorkout = {
  id: string;
  date: string;
  title: string;
  type: WorkoutType;
  planned_duration_sec: number;
  status: "planned" | "completed" | "skipped";
  athlete?: { display_name: string; emoji: string };
  workout_results?: Array<{ duration_sec: number; load: number }>;
};

function workoutCardData(workout: CalendarWorkout): WorkoutCardData {
  const result = workout.workout_results?.[0];
  return {
    id: workout.id,
    title: workout.title,
    type: workout.type,
    planned_duration_sec: Number(workout.planned_duration_sec),
    status: workout.status,
    result: result ? { duration_sec: Number(result.duration_sec), load: Number(result.load) } : null,
    athlete: workout.athlete,
  };
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string; athlete?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const params = await searchParams;
  const [me, members] = await Promise.all([requireProfile(), getMembers()]);
  const parsedWeek = params.week ? parseISO(params.week) : new Date();
  const monday = startOfWeek(isValid(parsedWeek) ? parsedWeek : new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const start = format(monday, "yyyy-MM-dd");
  const end = format(days[6], "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const isCurrentWeek = today >= start && today <= end;
  const requestedAthlete = params.athlete ?? ALL_ATHLETES;
  const athlete = requestedAthlete === ALL_ATHLETES || members.some((member) => member.id === requestedAthlete) ? requestedAthlete : me.id;
  const [rawWorkouts, crewResults] = await Promise.all([
    athlete === ALL_ATHLETES ? getWeekWorkoutsForCrew(start, end) : getWeekWorkouts(athlete, start, end),
    getCrewLoads(start, end),
  ]);
  const workouts = rawWorkouts as CalendarWorkout[];
  const results = workouts.flatMap((workout) => workout.workout_results ?? []);
  const actualLoad = results.reduce((total, result) => total + Number(result.load ?? 0), 0);
  const trainedSeconds = results.reduce((total, result) => total + Number(result.duration_sec ?? 0), 0);
  const completion = workouts.length ? Math.round((results.length / workouts.length) * 100) : 0;
  const todayWorkouts = isCurrentWeek ? workouts.filter((workout) => workout.date === today) : [];
  const nextWorkout = isCurrentWeek
    ? workouts.find((workout) => workout.date > today && workout.status === "planned")
    : undefined;
  const crewTotals = members
    .map((member) => ({
      ...member,
      load: crewResults.filter((result) => result.athlete_id === member.id).reduce((sum, result) => sum + Number(result.load), 0),
    }))
    .sort((a, b) => b.load - a.load);
  const crewMax = Math.max(1, ...crewTotals.map((member) => member.load));

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Training dashboard</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{me.emoji} {me.display_name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/workout/new" className="btn-ghost">Plan workout</Link>
          <Link href="/log" className="btn-primary">＋ Log activity</Link>
        </div>
      </header>

      {isCurrentWeek ? (
        <section className="mt-5 overflow-hidden rounded-3xl border border-brand-500/60 bg-[radial-gradient(circle_at_top_right,#4a3b0c_0,transparent_24rem),linear-gradient(135deg,#1b2029,#101218)] shadow-[0_20px_60px_rgba(0,0,0,.3)]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-brand-400">Today · {format(new Date(), "EEEE")}</p>
                <h2 className="mt-1 text-3xl font-black sm:text-4xl">{format(new Date(), "d MMMM")}</h2>
                <p className="mt-2 text-ink-200">
                  {todayWorkouts.length
                    ? `${todayWorkouts.length} session${todayWorkouts.length === 1 ? "" : "s"} on the plan.`
                    : "Nothing planned today. Recover, log an activity, or add a session."}
                </p>
              </div>
              {!todayWorkouts.length && <Link href={`/workout/new?date=${today}`} className="btn-primary">＋ Plan today</Link>}
            </div>

            {todayWorkouts.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {todayWorkouts.map((workout) => (
                  <WorkoutCard key={workout.id} crew={athlete === ALL_ATHLETES} workout={workoutCardData(workout)} />
                ))}
              </div>
            )}
          </div>
          {nextWorkout && (
            <Link href={`/workout/${nextWorkout.id}`} className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-5 py-4 text-sm transition hover:bg-white/5 sm:px-6">
              <span><span className="text-ink-400">Next up</span> <b className="ml-2">{format(parseISO(nextWorkout.date), "EEE d MMM")} · {nextWorkout.title}</b></span>
              <span aria-hidden="true" className="text-brand-400">→</span>
            </Link>
          )}
        </section>
      ) : (
        <section className="card mt-5">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-brand-400">Week overview</p>
          <h2 className="mt-1 text-3xl font-black">{format(monday, "d MMM")} — {format(days[6], "d MMM")}</h2>
          <p className="mt-2 text-ink-400">You are viewing a week away from today.</p>
        </section>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Weekly load" value={actualLoad} detail="completed load" accent />
        <Metric label="Sessions" value={`${results.length} / ${workouts.length}`} detail={`${completion}% completed`} />
        <Metric label="Time trained" value={formatTrainingTime(trainedSeconds)} detail="completed this week" />
      </section>

      <section className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-ink-400">Schedule</p>
            <h2 className="mt-1 text-2xl font-black">{format(monday, "d MMM")} — {format(days[6], "d MMM")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/?week=${format(addDays(monday, -7), "yyyy-MM-dd")}&athlete=${athlete}`} className="btn-ghost" aria-label="Previous week">←</Link>
            <Link href={`/?athlete=${athlete}`} className="btn-ghost">Today</Link>
            <Link href={`/?week=${format(addDays(monday, 7), "yyyy-MM-dd")}&athlete=${athlete}`} className="btn-ghost" aria-label="Next week">→</Link>
            <AthletePicker value={athlete} week={start} athletes={members} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {days.map((day) => {
            const date = format(day, "yyyy-MM-dd");
            const sessions = workouts.filter((workout) => workout.date === date);
            const isToday = date === today;
            return (
              <article key={date} className={`card min-h-40 ${isToday ? "border-brand-500 ring-1 ring-brand-500/30" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-wider text-ink-400">{format(day, "EEE")}</span>
                    <h3 className="text-xl font-black">{format(day, "d MMM")}{isToday && <span className="ml-2 text-xs text-brand-400">TODAY</span>}</h3>
                  </div>
                  <Link href={`/workout/new?date=${date}`} className="chip">＋ Add</Link>
                </div>
                <div className="mt-4 space-y-2">
                  {sessions.length
                    ? sessions.map((workout) => <WorkoutCard key={workout.id} crew={athlete === ALL_ATHLETES} workout={workoutCardData(workout)} />)
                    : <p className="py-4 text-sm text-ink-400">Rest day</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card mt-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-ink-400">Crew</p>
            <h2 className="mt-1 text-xl font-black">This week</h2>
          </div>
          <span className="text-sm text-ink-400">completed load</span>
        </div>
        {crewTotals.some((member) => member.load > 0) ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {crewTotals.map((member) => (
              <Link href={`/?week=${start}&athlete=${member.id}`} key={member.id} className={`grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 rounded-xl p-2 text-sm transition hover:bg-ink-800 ${athlete === member.id ? "bg-brand-400/10 text-brand-400" : ""}`}>
                <span className="truncate">{member.emoji} {member.display_name}</span>
                <div className="h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-brand-400" style={{ width: `${member.load / crewMax * 100}%` }} /></div>
                <b className="text-right">{member.load}</b>
              </Link>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-ink-400">No completed sessions this week yet.</p>}
      </section>
    </div>
  );
}

function Metric({ label, value, detail, accent = false }: { label: string; value: string | number; detail: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="text-sm text-ink-400">{label}</div>
      <div className={`mt-1 text-3xl font-black ${accent ? "text-brand-400" : ""}`}>{value}</div>
      <div className="mt-1 text-sm text-ink-400">{detail}</div>
    </div>
  );
}

function formatTrainingTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours ? `${hours}h ` : ""}${minutes}m`;
}

function SetupNotice() {
  return <div className="py-12"><div className="card mx-auto max-w-xl text-center"><div className="text-4xl">🔐</div><h1 className="mt-3 text-2xl font-black">Connect Supabase to begin</h1><p className="mt-2 text-ink-400">The demo data has been removed. Add the Supabase environment variables and your five allowlisted usernames to start with a clean shared calendar.</p></div></div>;
}
