"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "nova", label: "Nova" },
  { value: "em_analise", label: "Em analise" },
  { value: "aprovada", label: "Aprovada" },
  { value: "recusada", label: "Recusada" },
  { value: "cancelada", label: "Cancelada" }
];

type ProposalStatusSelectProps = {
  proposalId: string;
  initialStatus: string;
};

export function ProposalStatusSelect({ proposalId, initialStatus }: ProposalStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    setStatus(nextStatus);
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/propostas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: proposalId,
          status: nextStatus
        })
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Nao foi possivel atualizar o status.");
      }

      router.refresh();
    } catch (caughtError) {
      setStatus(initialStatus);
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel atualizar o status.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-w-36">
      <select
        value={status}
        disabled={isSaving}
        onChange={(event) => updateStatus(event.target.value)}
        className="w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-navy outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
