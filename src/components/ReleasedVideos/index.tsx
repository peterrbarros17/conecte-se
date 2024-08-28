import { fetchDataLive, fetchDataVideo } from "@/api/fetchVideosData";

export default async function ReleasedVideos() {
  // ÚLTIMO VÍDEO DO CANAL UPETER
  const apiKeyUpeter = process.env.LATEST_VIDEO;
  const channelId = "UCaJscJxs5LEuwFShmKr39tg";
  let latestVideo = "";
  let latestLive = "";
  let latestSerie = "";

  try {
    const data = await fetchDataVideo(apiKeyUpeter, channelId, "any");
    if (data && data.items && data.items.length > 0) {
      latestVideo = data.items[0].id.videoId;
    } else {
      console.error("No video data available");
    }
  } catch (error) {
    console.error("Error fetching latest video", error);
  }

  // ÚLTIMO LIVE DO CANAL UPETER
  try {
    const dataLive = await fetchDataLive(apiKeyUpeter, channelId);
    if (dataLive && dataLive.items && dataLive.items.length > 0) {
      latestLive = dataLive.items[0].id.videoId;
    } else {
      console.error("No live data available");
    }
  } catch (error) {
    console.error("Error fetching latest live", error);
  }

  // ÚLTIMO VÍDEO DO CANAL OPITÃOZERA
  try {
    const apiKeyOpitaozera = process.env.LATEST_SERIE;
    const channelIdOp = "UCwEtLdRuDPN96HEPzcy5mig";
    const dataSerie = await fetchDataVideo(
      apiKeyOpitaozera,
      channelIdOp,
      "any"
    );
    if (dataSerie && dataSerie.items && dataSerie.items.length > 0) {
      latestSerie = dataSerie.items[0].id.videoId;
    } else {
      console.error("No series data available");
    }
  } catch (error) {
    console.error("Error fetching latest serie");
  }
  return (
    <section>
      <ul className="text-2xl flex flex-col gap-4">
        <li className="">
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Último vídeo
          </h1>
          {latestVideo ? (
            <iframe
              className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
              src={`https://www.youtube.com/embed/${latestVideo}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <p>Vídeo não disponível</p>
          )}
        </li>
        <li>
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Última live
          </h1>
          {latestLive ? (
            <iframe
              className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
              src={`https://www.youtube.com/embed/${latestLive}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <p>Live não disponível</p>
          )}
        </li>
        <li>
          <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
            Última série
          </h1>
          {latestSerie ? (
            <iframe
              className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
              src={`https://www.youtube.com/embed/${latestSerie}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <p>Série não disponível</p>
          )}
        </li>
      </ul>
    </section>
  );
}
