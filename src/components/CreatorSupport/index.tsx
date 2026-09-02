import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import CopyCreatorCode from "./CopyCreatorCode";

export default function CreatorSupport() {
  return (
    <section className="glass-card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-violet-500" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative">
        <h2 className="section-label">Apoie o criador</h2>
        <p className="mt-2 text-xl font-bold tracking-tight text-ink">
          Ajude o canal a crescer
        </p>
        <p className="mt-1 text-sm text-muted">
          Use o código na Epic Games ou envie uma doação pelo LivePix.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <CopyCreatorCode code="UPETER-YT" />
          <Link
            href="https://livepix.gg/upeter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[5.5rem] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <FaHeart size={14} />
            Fazer uma doação
          </Link>
        </div>
      </div>
    </section>
  );
}
