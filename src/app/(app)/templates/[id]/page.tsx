import { notFound } from "next/navigation";
import { DraftBuilder } from "@/components/draft-builder";
import type { WorkoutType } from "@/lib/constants";
import { getTemplateDetail } from "@/lib/data";
import { requireProfile } from "@/lib/session";
import type { WorkoutStructure } from "@/lib/workout";

export default async function TemplatePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const [template,me]=await Promise.all([getTemplateDetail(id),requireProfile()]);if(!template)notFound();const item=[...(template.plan_template_items??[])].sort((a,b)=>a.week-b.week||a.day_of_week-b.day_of_week)[0];if(!item)notFound();return <div className="py-6"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-400">Training draft</p><h1 className="mt-1 mb-6 text-3xl font-black">Edit draft</h1><DraftBuilder division={me.division} initialDraft={{id:template.id,itemId:item.id,title:item.title??template.name,description:template.description??"",type:item.type as WorkoutType,structure:item.structure as WorkoutStructure,notes:item.notes??""}}/></div>}
