import { fetchCreatorData } from "@/api/fetchCreatorData";
import { CreatorDataType } from "@/types/creatorDataType";
import Image from "next/image";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

const FALLBACK: CreatorDataType = {
  creator: {
    creatorName: "UPeter",
    creatorPlatform: "Youtuber, Streamer",
    creatorLocation: "Fortaleza, Brasil",
    creatorPhraseMotivation:
      "Amo jogos digitais e compartilhar minha paixão através de livestreams.",
    creatorEmail: "upeter2019@gmail.com",
  },
};

export default async function CreatorInformation() {
  let creatorData = FALLBACK;

  try {
    const data = await fetchCreatorData();
    if (data?.creator?.creatorName) {
      creatorData = data;
    }
  } catch {
    creatorData = FALLBACK;
  }

  const { creator } = creatorData;

  return (
    <header>
      <div className="relative h-36 overflow-hidden sm:h-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(225,29,72,0.55),transparent_55%),radial-gradient(ellipse_at_90%_10%,rgba(124,58,237,0.5),transparent_50%),linear-gradient(135deg,#1a1020_0%,#12121c_100%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="-mt-16 flex flex-col items-center px-6 pb-6 text-center sm:px-8">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-rose-500/50 via-violet-500/40 to-cyan-400/40 blur-sm" />
          <div className="relative rounded-full bg-gradient-to-br from-rose-500 via-violet-500 to-cyan-400 p-[3px]">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-elevated sm:h-32 sm:w-32">
              <Image
                alt="Foto de perfil de UPeter"
                src="https://creator-photo.s3.us-east-2.amazonaws.com/EU.png"
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            {creator.creatorName}
          </h1>
          <FaCheckCircle className="text-accent" size={18} aria-label="Verificado" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-elevated/70 px-3 py-1 text-xs font-medium text-ink">
            {creator.creatorPlatform}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-elevated/70 px-3 py-1 text-xs font-medium text-ink">
            <FaLocationDot className="text-accent" size={12} />
            {creator.creatorLocation}
          </span>
        </div>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          {creator.creatorPhraseMotivation}
        </p>

        <Link
          href={`mailto:${creator.creatorEmail}`}
          className="mt-4 text-sm font-medium text-ink/80 underline decoration-hairline underline-offset-4 transition hover:text-accent hover:decoration-accent"
        >
          {creator.creatorEmail}
        </Link>
      </div>
    </header>
  );
}
