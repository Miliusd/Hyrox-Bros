"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
const schema=z.object({displayName:z.string().trim().min(1).max(100),emoji:z.string().min(1).max(8),division:z.enum(["men_open","women_open","men_pro","women_pro"]),thresholdPace:z.number().int().min(120).max(900),weightKg:z.number().positive().nullable(),goalRaceName:z.string().max(200).nullable(),goalRaceDate:z.iso.date().nullable()});
export async function updateProfile(input:unknown){const parsed=schema.safeParse(input);if(!parsed.success)return{ok:false,error:parsed.error.issues[0]?.message};try{const me=await requireProfile();const db=await createClient();const {error}=await db.from("profiles").update({display_name:parsed.data.displayName,emoji:parsed.data.emoji,division:parsed.data.division,threshold_pace_sec_per_km:parsed.data.thresholdPace,weight_kg:parsed.data.weightKg,goal_race_name:parsed.data.goalRaceName,goal_race_date:parsed.data.goalRaceDate}).eq("id",me.id);if(error)throw error;revalidatePath("/settings");return{ok:true};}catch(error){return{ok:false,error:error instanceof Error?error.message:"Could not save profile"}}}
