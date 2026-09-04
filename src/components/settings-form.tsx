"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { Division } from "@/lib/hyrox";
import { formatPace, parsePace } from "@/lib/workout";

type Profile = {
  display_name: string;
  emoji: string;
  division: Division;
  threshold_pace_sec_per_km: number;
  weight_kg: number | null;
  goal_race_name: string | null;
  goal_race_date: string | null;
};

export function SettingsForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile.display_name);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [division, setDivision] = useState(profile.division);
  const [pace, setPace] = useState(formatPace(profile.threshold_pace_sec_per_km));
  const [weight, setWeight] = useState(profile.weight_kg?.toString() ?? "");
  const [raceName, setRaceName] = useState(profile.goal_race_name ?? "");
  const [raceDate, setRaceDate] = useState(profile.goal_race_date ?? "");
  const [message, setMessage] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const seconds = parsePace(pace);
    if (seconds === null) {
      setMessage("Enter pace as min:sec, between 2:00 and 15:00.");
      return;
    }
    startTransition(async () => {
      const result = await updateProfile({
        displayName: name,
        emoji,
        division,
        thresholdPace: seconds,
        weightKg: weight ? Number(weight) : null,
        goalRaceName: raceName || null,
        goalRaceDate: raceDate || null,
      });
      setMessage(result.ok ? "Profile saved." : result.error ?? "Could not save profile");
    });
  }

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <h2 className="text-xl font-black">Profile</h2>
      <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
        <label>
          <span className="label">Avatar</span>
          <input className="input text-center text-xl" value={emoji} onChange={(event) => setEmoji(event.target.value)} />
        </label>
        <label>
          <span className="label">Display name</span>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
      </div>
      <label>
        <span className="label">Division</span>
        <select className="input" value={division} onChange={(event) => setDivision(event.target.value as Division)}>
          <option value="men_open">Men Open</option>
          <option value="women_open">Women Open</option>
          <option value="men_pro">Men Pro</option>
          <option value="women_pro">Women Pro</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className="label">Threshold pace (min/km)</span>
          <input
            className="input"
            inputMode="text"
            autoCapitalize="none"
            value={pace}
            onChange={(event) => setPace(event.target.value)}
            placeholder="4:30"
          />
          <span className="mt-1 block text-sm text-ink-400">Use 4:30, 4.30 or 4,30.</span>
        </label>
        <label>
          <span className="label">Weight kg</span>
          <input className="input" type="number" min="1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
        </label>
      </div>
      <label>
        <span className="label">Goal race</span>
        <input className="input" value={raceName} onChange={(event) => setRaceName(event.target.value)} />
      </label>
      <label>
        <span className="label">Race date</span>
        <input className="input" type="date" value={raceDate} onChange={(event) => setRaceDate(event.target.value)} />
      </label>
      {message && <p className={message === "Profile saved." ? "text-emerald-300" : "text-red-300"}>{message}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
