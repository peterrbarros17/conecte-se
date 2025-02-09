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
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
        <h3 className="bg-primary-light dark:bg-primary-dark text-white p-2 md:p-3 font-semibold">
          Último vídeo
        </h3>
        <div className="p-2 md:p-4">
          {latestVideo ? (
            <div className="aspect-video w-full max-w-2xl lg:max-w-4xl mx-auto">
              <iframe
                className="w-full h-[200px] md:h-[350px] lg:h-[450px]"
                src={`https://www.youtube.com/embed/${latestVideo}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-2 md:py-4">Vídeo não disponível</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
        <h3 className="bg-secondary-light dark:bg-secondary-dark text-white p-2 md:p-3 font-semibold">
          Última live
        </h3>
        <div className="p-2 md:p-4">
          {latestLive ? (
            <div className="aspect-video w-full max-w-2xl lg:max-w-4xl mx-auto">
              <iframe
                className="w-full h-[200px] md:h-[350px] lg:h-[450px]"
                src={`https://www.youtube.com/embed/${latestLive}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-2 md:py-4">Live não disponível</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
        <h3 className="bg-primary-light dark:bg-primary-dark text-white p-2 md:p-3 font-semibold">
          Última série
        </h3>
        <div className="p-2 md:p-4">
          {latestSerie ? (
            <div className="aspect-video w-full max-w-2xl lg:max-w-4xl mx-auto">
              <iframe
                className="w-full h-[200px] md:h-[350px] lg:h-[450px]"
                src={`https://www.youtube.com/embed/${latestSerie}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-2 md:py-4">Série não disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}
