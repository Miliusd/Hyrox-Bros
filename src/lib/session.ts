import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
export const requireProfile = cache(async () => { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single(); if (error) throw error; return data; });
export const getMembers = cache(async () => { const supabase = await createClient(); const { data, error } = await supabase.from("profiles").select("id,display_name,emoji,division,role,max_hr_bpm").order("display_name"); if (error) throw error; return data; });
