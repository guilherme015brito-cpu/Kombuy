"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
};

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-brand-line bg-white px-3 py-2 text-xs font-bold text-brand-navy transition hover:border-brand-blue"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
