import { fetchDataLive, fetchDataVideo } from "@/api/fetchVideosData";
import type { ReactNode } from "react";
import { FaCircle, FaFilm, FaYoutube } from "react-icons/fa";

type VideoIds = {
  latestVideo: string;
  latestLive: string;
  latestSerie: string;
};

type VideoCardProps = {
  title: string;
  videoId: string;
  emptyLabel: string;
  icon: ReactNode;
  accentClass: string;
};

export async function getReleasedVideos(): Promise<VideoIds> {
  const apiKeyUpeter = process.env.LATEST_VIDEO;
  const channelId = "UCaJscJxs5LEuwFShmKr39tg";
  let latestVideo = "";
  let latestLive = "";
  let latestSerie = "";

  try {
    const data = await fetchDataVideo(apiKeyUpeter, channelId, "any");
    if (data && data.items && data.items.length > 0) {
      latestVideo = data.items[0].id.videoId;
    }
  } catch (error) {
    console.error("Error fetching latest video", error);
  }

  try {
    const dataLive = await fetchDataLive(apiKeyUpeter, channelId);
    if (dataLive && dataLive.items && dataLive.items.length > 0) {
      latestLive = dataLive.items[0].id.videoId;
    }
  } catch (error) {
    console.error("Error fetching latest live", error);
  }

  try {
    const apiKeyOpitaozera = process.env.LATEST_SERIE;
    const channelIdOp = "UCwEtLdRuDPN96HEPzcy5mig";
    const dataSerie = await fetchDataVideo(apiKeyOpitaozera, channelIdOp, "any");
    if (dataSerie && dataSerie.items && dataSerie.items.length > 0) {
      latestSerie = dataSerie.items[0].id.videoId;
    }
  } catch (error) {
    console.error("Error fetching latest serie");
  }

  return { latestVideo, latestLive, latestSerie };
}

function VideoFrame({
  videoId,
  title,
  emptyLabel,
  icon,
}: Pick<VideoCardProps, "videoId" | "title" | "emptyLabel" | "icon">) {
  if (videoId) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/80">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-surface/60 px-4 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-muted">
        {icon}
      </span>
      <p className="text-sm font-medium text-ink/80">{emptyLabel}</p>
      <p className="text-xs text-muted">Volte em breve para o conteúdo mais recente.</p>
    </div>
  );
}

function VideoCard({
  title,
  videoId,
  emptyLabel,
  icon,
  accentClass,
}: VideoCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-hairline bg-elevated/80 shadow-card">
      <header className="flex items-center gap-2.5 px-4 py-3 sm:px-5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${accentClass}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-ink sm:text-base">{title}</h3>
      </header>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <VideoFrame
          videoId={videoId}
          title={title}
          emptyLabel={emptyLabel}
          icon={icon}
        />
      </div>
    </article>
  );
}

export function FeaturedVideo({ videoId }: { videoId: string }) {
  return (
    <section className="min-w-0 animate-fade-up [animation-delay:120ms]">
      <div className="glass-card p-5 sm:p-6">
        <div className="mb-5">
          <p className="section-label">Conteúdo</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Último vídeo
          </h2>
        </div>
        <VideoCard
          title="Último vídeo"
          videoId={videoId}
          emptyLabel="Vídeo não disponível"
          icon={<FaYoutube size={14} />}
          accentClass="bg-red-600"
        />
      </div>
    </section>
  );
}

export function LiveAndSeries({
  liveId,
  serieId,
}: {
  liveId: string;
  serieId: string;
}) {
  return (
    <section className="animate-fade-up [animation-delay:180ms]">
      <div className="glass-card p-5 sm:p-6">
        <div className="mb-5">
          <p className="section-label">Destaques</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Live e série
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <VideoCard
            title="Última live"
            videoId={liveId}
            emptyLabel="Live não disponível"
            icon={<FaCircle size={10} />}
            accentClass="bg-violet-600"
          />
          <VideoCard
            title="Última série"
            videoId={serieId}
            emptyLabel="Série não disponível"
            icon={<FaFilm size={13} />}
            accentClass="bg-rose-600"
          />
        </div>
      </div>
    </section>
  );
}
