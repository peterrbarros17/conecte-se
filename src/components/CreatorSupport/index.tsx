import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import CopyCreatorCode from "./CopyCreatorCode";

export default function CreatorSupport() {
  return (
    <section className="glass-card p-5 sm:p-6">
      <h2 className="section-label">Apoie o criador</h2>
      <p className="mt-2 text-sm text-muted">
        Use o código na Epic ou envie uma doação pelo LivePix.
      </p>
      <div className="mt-4 space-y-3">
        <CopyCreatorCode code="UPETER-YT" />
        <Link
          href="https://livepix.gg/upeter"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:brightness-110"
        >
          <FaHeart size={14} />
          Fazer uma doação
        </Link>
      </div>
    </section>
  );
}
