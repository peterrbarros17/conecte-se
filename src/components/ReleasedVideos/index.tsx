import { fetchDataLive, fetchDataVideo } from "@/api/fetchVideosData";
import type { ReactNode } from "react";
import { FaCircle, FaFilm, FaYoutube } from "react-icons/fa";

type VideoCardProps = {
  title: string;
  videoId: string;
  emptyLabel: string;
  icon: ReactNode;
  accentClass: string;
};

function VideoCard({
  title,
  videoId,
  emptyLabel,
  icon,
  accentClass,
}: VideoCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-hairline bg-elevated/80 shadow-card">
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${accentClass}`}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
      </header>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        {videoId ? (
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
        ) : (
          <div className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-surface/60 px-4 py-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-muted">
              {icon}
            </span>
            <p className="text-sm font-medium text-ink/80">{emptyLabel}</p>
            <p className="text-xs text-muted">Volte em breve para o conteúdo mais recente.</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default async function ReleasedVideos() {
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

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="section-label">Conteúdo</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Últimos vídeos
          </h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <VideoCard
            title="Último vídeo"
            videoId={latestVideo}
            emptyLabel="Vídeo não disponível"
            icon={<FaYoutube size={14} />}
            accentClass="bg-red-600"
          />
        </div>
        <VideoCard
          title="Última live"
          videoId={latestLive}
          emptyLabel="Live não disponível"
          icon={<FaCircle size={10} />}
          accentClass="bg-violet-600"
        />
        <VideoCard
          title="Última série"
          videoId={latestSerie}
          emptyLabel="Série não disponível"
          icon={<FaFilm size={13} />}
          accentClass="bg-rose-600"
        />
      </div>
    </div>
  );
}
