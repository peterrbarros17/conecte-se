"use client";

import { useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";

export default function CopyCreatorCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-hairline bg-elevated/80 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
    >
      <span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Código Epic Games
        </span>
        <span className="mt-1 block text-lg font-extrabold tracking-wide text-ink">
          {code}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {copied ? "Código copiado!" : "Use na loja da Epic Games"}
        </span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition group-hover:scale-105">
        {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
        <span className="sr-only">
          {copied ? "Código copiado" : "Copiar código"}
        </span>
      </span>
    </button>
  );
}
