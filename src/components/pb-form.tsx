"use client";
import { DecimalInput } from "@/components/decimal-input";
import { useState } from "react";
import { useTransition } from "react";
import { saveStationResult } from "@/lib/actions/social";
import { parseDuration } from "@/lib/workout";

const TESTS = [
  { id: "ski_erg", label: "🎿 SkiErg", distances: [250, 500, 1000, 2000, 5000] },
  { id: "row", label: "🚣 Rowing", distances: [250, 500, 1000, 2000, 5000] },
  { id: "run", label: "🏃 Run", distances: [1000, 5000, 10000, 21097] },
  { id: "sled_push", label: "🛷 Sled Push", distances: [25, 50, 100] },
  { id: "sled_pull", label: "🪢 Sled Pull", distances: [25, 50, 100] },
  { id: "burpee_broad_jump", label: "🤸 Burpee Broad Jumps", distances: [40, 80, 100] },
  { id: "farmers_carry", label: "🧳 Farmers Carry", distances: [100, 200, 400] },
  { id: "sandbag_lunges", label: "🎒 Sandbag Lunges", distances: [50, 100, 200] },
  { id: "wall_balls", label: "🏐 Wall Balls", reps: [50, 75, 100, 150] },
  { id: "full_race", label: "🏁 Full race" },
] as const;

export function PbForm({athleteId}:{athleteId:string}){
  const [pending,startTransition]=useTransition();
  const [saved,setSaved]=useState(false);
  const [testId,setTestId]=useState<string>(TESTS[0].id);
  const [distance,setDistance]=useState<number>(1000); const [targetReps,setTargetReps]=useState<number>(100); const [metric,setMetric]=useState("time_sec"); const [result,setResult]=useState(""); const [loadKg,setLoadKg]=useState(""); const [message,setMessage]=useState("");
  const selected=TESTS.find((test)=>test.id===testId)!;
  const distances="distances" in selected ? selected.distances : undefined;
  const reps="reps" in selected ? selected.reps : undefined;
  return <form className="card space-y-4" onSubmit={(e)=>{e.preventDefault();const value=metric==="time_sec"?parseDuration(result):Number(result);if(!value){setMessage("Enter a valid result.");return}const key=distances?`${testId}_${distance}m`:reps?`${testId}_${targetReps}reps`:testId;startTransition(async()=>{const response=await saveStationResult({athlete_id:athleteId,date:new Date().toISOString().slice(0,10),station:key,metric,value,load_kg:loadKg?Number(loadKg):null});setSaved(response.ok);setMessage(response.ok?"Benchmark saved.":response.error??"Could not save benchmark")})}}><h2 className="text-xl font-black">Log a benchmark</h2><label><span className="label">Exercise or race</span><select className="input" value={testId} onChange={(e)=>{const next=e.target.value;setTestId(next);setDistance((TESTS.find(t=>t.id===next)&&"distances" in TESTS.find(t=>t.id===next)!?Number((TESTS.find(t=>t.id===next) as {distances:readonly number[]}).distances[0]):1000));setSaved(false)}}>{TESTS.map((test)=><option value={test.id} key={test.id}>{test.label}</option>)}</select></label>{distances&&<label><span className="label">Distance</span><select className="input" value={distance} onChange={(e)=>setDistance(Number(e.target.value))}>{distances.map((item)=><option value={item} key={item}>{item===21097?"Half marathon":item>=1000?`${item/1000} km`:`${item} m`}</option>)}</select></label>}{reps&&<label><span className="label">Target reps</span><select className="input" value={targetReps} onChange={(e)=>setTargetReps(Number(e.target.value))}>{reps.map((count)=><option value={count} key={count}>{count} reps</option>)}</select></label>}<div className="grid grid-cols-2 gap-3"><label><span className="label">Metric</span><select className="input" value={metric} onChange={(e)=>setMetric(e.target.value)}><option value="time_sec">Time</option><option value="reps">Reps</option><option value="max_kg">Max kg</option></select></label><label><span className="label">Result</span>{metric === "time_sec" ? <input className="input" required value={result} onChange={(e)=>setResult(e.target.value)} placeholder="4:20"/> : <DecimalInput key={metric} className="input" required min="0" step={metric === "reps" ? "1" : "any"} value={result} onValueChange={setResult} placeholder="100"/>}</label></div>{testId!=="run"&&testId!=="full_race"&&<label><span className="label">Load kg</span><DecimalInput min="0" step="0.5" className="input" value={loadKg} onValueChange={(raw)=>setLoadKg(raw)} placeholder="Optional" /></label>}{message&&<p className={saved?"text-emerald-300":"text-red-300"}>{message}</p>}<button className="btn-primary w-full" disabled={pending}>{pending?"Saving…":"Save PB"}</button></form>}
