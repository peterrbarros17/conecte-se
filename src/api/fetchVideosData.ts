import { VideoData } from "@/types/videoDataType";

export async function fetchDataVideo(
  apiKey: string | undefined,
  channelId: string,
  size: "long" | "medium" | "any"
): Promise<VideoData> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&type=video&videoDuration=${size}&maxResults=1`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) {
    throw new Error(`YouTube API responded with ${res.status}`);
  }

  return res.json();
}
export async function fetchDataLive(
  apiKey: string | undefined,
  channelId: string
): Promise<VideoData> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&eventType=completed&type=video&order=date&maxResults=1`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) {
    throw new Error(`YouTube API responded with ${res.status}`);
  }

  return res.json();
}
