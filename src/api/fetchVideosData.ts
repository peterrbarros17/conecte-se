import { fetchJsonWithTimeout, requireConfig } from "@/api/externalRequest";
import { isVideoData } from "@/api/validation";
import type { VideoData } from "@/types/videoDataType";

export async function fetchDataVideo(
  apiKey: string | undefined,
  channelId: string,
  size: "long" | "medium" | "any"
): Promise<VideoData> {
  const key = requireConfig(apiKey, "LATEST_VIDEO");
  const data = await fetchJsonWithTimeout(
    `https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${channelId}&part=snippet,id&order=date&type=video&videoDuration=${size}&maxResults=1`,
    { next: { revalidate: 300 } },
    "YouTube API"
  );

  if (!isVideoData(data)) {
    throw new Error("YouTube API returned invalid data");
  }

  return data;
}

export async function fetchDataLive(
  apiKey: string | undefined,
  channelId: string
): Promise<VideoData> {
  const key = requireConfig(apiKey, "LATEST_VIDEO");
  const data = await fetchJsonWithTimeout(
    `https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${channelId}&part=snippet,id&eventType=completed&type=video&order=date&maxResults=1`,
    { next: { revalidate: 300 } },
    "YouTube API"
  );

  if (!isVideoData(data)) {
    throw new Error("YouTube API returned invalid data");
  }

  return data;
}
