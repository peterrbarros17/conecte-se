interface VideoData {
  items: {
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
    id: { videoId: string };
  }[];
}
export async function fetchDataVideo(
  apiKey: string | undefined,
  channelId: string,
  size: "long" | "medium"
): Promise<VideoData> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&type=video&videoDuration=${size}&maxResults=1`
  );
  if (!res.ok) console.log("Error");

  return res.json();
}
export async function fetchDataSerie(
  apiKey: string | undefined,
  channelId: string
): Promise<VideoData> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&eventType=completed&type=video&order=date&maxResults=1`
  );
  if (!res.ok) console.log("Error");

  return res.json();
}
