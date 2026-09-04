"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDraft } from "@/lib/actions/templates";

export function DeleteDraftButton({ draftId, title }: { draftId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    if (!window.confirm(`Delete the “${title}” draft? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteDraft(draftId);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Could not delete draft");
    });
  }

  return <div>
    <button type="button" className="btn-ghost border-red-800 text-red-300 hover:border-red-600 hover:text-red-200" disabled={pending} onClick={remove}>{pending ? "Deleting…" : "Delete"}</button>
    {error && <p className="mt-2 text-sm text-red-300" role="status">{error}</p>}
  </div>;
}
