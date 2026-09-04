"use client";
import { useEffect } from "react";

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute(input: unknown): unknown };
declare global { interface Document { modelContext?: { registerTool(tool: Tool, options?: { signal?: AbortSignal }): void | Promise<void> } } }

export function WebMcpTools() {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const navigate = (path: string) => { window.location.assign(path); return { status: "opened", path }; };
    const tools: Tool[] = [
      { name: "start_workout_creation", title: "Plan a workout", description: "Open the HyroxBros workout builder, optionally prefilled with an ISO date.", inputSchema: { type: "object", properties: { date: { type: "string", format: "date" } }, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { const date = typeof input === "object" && input && "date" in input ? String((input as { date: unknown }).date) : ""; if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD"); return navigate(date ? `/workout/new?date=${date}` : "/workout/new"); } },
      { name: "start_quick_activity_log", title: "Quick-log activity", description: "Open the quick activity logger for an unplanned training session.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute() { return navigate("/log"); } },
    ];
    for (const tool of tools) void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return null;
}
