import { fetchDataLive, fetchDataVideo } from "@/api/fetchVideosData";

export default async function ReleasedVideos() {
  // ÚLTIMO VÍDEO DO CANAL UPETER
  const apiKeyUpeter = process.env.LATEST_VIDEO;
  const channelId = "UCaJscJxs5LEuwFShmKr39tg";
  const data = await fetchDataVideo(apiKeyUpeter, channelId, "any");

  const latestVideo = data.items[0].id.videoId;

  // ÚLTIMO LIVE DO CANAL UPETER
  const dataLive = await fetchDataLive(apiKeyUpeter, channelId);
  const latestLive = dataLive.items[0].id.videoId;

  const apiKeyOpitaozera = process.env.LATEST_SERIE;
  const channelIdOp = "UCwEtLdRuDPN96HEPzcy5mig";

  // ÚLTIMO VÍDEO DO CANAL OPITÃOZERA
  const dataSerie = await fetchDataVideo(apiKeyOpitaozera, channelIdOp, "any");
  const latestSerie = dataSerie.items[0].id.videoId;
  return (
    <section>
      <ul className="text-2xl flex flex-col gap-4">
        <li className="">
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Último vídeo
          </h1>
          <iframe
            className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
            src={`https://www.youtube.com/embed/${latestVideo}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </li>
        <li>
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Última live
          </h1>
          <iframe
            className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
            src={`https://www.youtube.com/embed/${latestLive}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </li>
        <li>
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Última série
          </h1>
          <iframe
            className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
            src={`https://www.youtube.com/embed/${latestSerie}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </li>
      </ul>
    </section>
  );
}
