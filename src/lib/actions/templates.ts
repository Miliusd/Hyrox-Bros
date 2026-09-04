"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { estimateStructureSeconds } from "@/lib/workout";
const uuid=z.uuid();
const draftSchema=z.object({id:uuid.optional(),itemId:uuid.optional(),title:z.string().trim().min(1).max(200),description:z.string().max(2000).optional(),type:z.enum(["run","erg","strength","hyrox_sim","compromised","recovery","other"]),structure:z.object({blocks:z.array(z.any())}),notes:z.string().max(5000).optional()});

export async function saveDraft(input:unknown){
  const parsed=draftSchema.safeParse(input);
  if(!parsed.success)return{ok:false,error:parsed.error.issues[0]?.message};
  let createdId:string|undefined;
  try{
    const db=await createClient();
    const me=await requireProfile();
    const templateRow={name:parsed.data.title,description:parsed.data.description,weeks:1};
    const templateQuery=parsed.data.id?db.from("plan_templates").update(templateRow).eq("id",parsed.data.id):db.from("plan_templates").insert({...templateRow,author_id:me.id});
    const {data:template,error:templateError}=await templateQuery.select("id").single();
    if(templateError)throw templateError;
    if(!parsed.data.id)createdId=template.id;
    const itemRow={template_id:template.id,week:1,day_of_week:1,title:parsed.data.title,type:parsed.data.type,structure:parsed.data.structure,planned_duration_sec:Math.round(estimateStructureSeconds(parsed.data.structure)),planned_load:0,notes:parsed.data.notes};
    const itemQuery=parsed.data.itemId?db.from("plan_template_items").update(itemRow).eq("id",parsed.data.itemId):db.from("plan_template_items").insert(itemRow);
    const {error:itemError}=await itemQuery;
    if(itemError)throw itemError;
    revalidatePath("/templates");
    revalidatePath(`/templates/${template.id}`);
    return{ok:true,id:template.id};
  }catch(error){
    if(createdId){const db=await createClient();await db.from("plan_templates").delete().eq("id",createdId);}
    return{ok:false,error:error instanceof Error?error.message:"Could not save draft"};
  }
}

export async function deleteDraft(id:string){
  try{const db=await createClient();await requireProfile();const {data,error}=await db.from("plan_templates").delete().eq("id",id).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("Draft not found or you do not have permission to delete it.");revalidatePath("/templates");return{ok:true};}
  catch(error){return{ok:false,error:error instanceof Error?error.message:"Could not delete draft"};}
}
