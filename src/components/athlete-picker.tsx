"use client";

import { useRouter } from "next/navigation";

export type AthleteOption = { id: string; display_name: string; emoji: string };
export function AthletePicker({ value, week, athletes, path = "/", includeCrew = true }: { value: string; week?: string; athletes: AthleteOption[]; path?: string; includeCrew?: boolean }) {
  const router = useRouter();
  return <select className="input ml-auto w-auto" value={value} aria-label="Show data for" onChange={(event) => { const query = new URLSearchParams(); if (week) query.set("week", week); query.set("athlete", event.target.value); router.replace(`${path}?${query.toString()}`, { scroll: false }); }}>
    {includeCrew && <option value="all">👥 All crew</option>}
    {athletes.map((athlete) => <option value={athlete.id} key={athlete.id}>{athlete.emoji} {athlete.display_name}</option>)}
  </select>;
}
