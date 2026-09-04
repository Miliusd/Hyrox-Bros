"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
export async function saveStationResult(input:Record<string,unknown>){try{const db=await createClient();const me=await requireProfile();const {data,error}=await db.from("station_results").insert({...input,athlete_id:input.athlete_id??me.id}).select("id").single();if(error)throw error;revalidatePath("/pbs");return{ok:true,id:data.id};}catch(error){return{ok:false,error:error instanceof Error?error.message:"Could not save PB"}}}
export async function deleteStationResult(id:string){const db=await createClient();const {error}=await db.from("station_results").delete().eq("id",id);revalidatePath("/pbs");return error?{ok:false,error:error.message}:{ok:true};}
export async function addComment(workoutId:string,body:string){try{const me=await requireProfile();const db=await createClient();const {data,error}=await db.from("comments").insert({workout_id:workoutId,author_id:me.id,body:body.trim()}).select("id").single();if(error)throw error;revalidatePath(`/workout/${workoutId}`);return{ok:true,id:data.id};}catch(error){return{ok:false,error:error instanceof Error?error.message:"Could not add comment"}}}
export async function deleteComment(id:string,workoutId:string){const db=await createClient();const {error}=await db.from("comments").delete().eq("id",id);revalidatePath(`/workout/${workoutId}`);return error?{ok:false,error:error.message}:{ok:true};}
