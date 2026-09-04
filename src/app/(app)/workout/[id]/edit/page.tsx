import { WorkoutBuilder } from "@/components/workout-builder";
import { getMembers, requireProfile } from "@/lib/session";
export default async function EditWorkoutPage(){const [me,members]=await Promise.all([requireProfile(),getMembers()]);return <div className="py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Update session</p><h1 className="mt-1 mb-6 text-3xl font-black">Edit workout</h1><WorkoutBuilder members={members} initialAthleteId={me.id}/></div>}
