"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkout } from "@/lib/actions/workouts";

export function DeleteWorkoutButton({ workoutId, title }: { workoutId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteWorkout(workoutId);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error ?? "Could not delete workout");
      }
    });
  }

  return (
    <div>
      <button type="button" className="btn-danger" disabled={pending} onClick={remove}>
        {pending ? "Deleting…" : "Delete workout"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}
