import type { CreatorDataType } from "@/types/creatorDataType";
import type { VideoData } from "@/types/videoDataType";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isCreatorDataType(value: unknown): value is CreatorDataType {
  if (!isRecord(value) || !isRecord(value.creator)) {
    return false;
  }

  const { creator } = value;
  return (
    isNonEmptyText(creator.creatorName) &&
    isNonEmptyText(creator.creatorPlatform) &&
    isNonEmptyText(creator.creatorLocation) &&
    isNonEmptyText(creator.creatorPhraseMotivation) &&
    isNonEmptyText(creator.creatorEmail)
  );
}

export function isVideoData(value: unknown): value is VideoData {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  if (value.items.length === 0) {
    return true;
  }

  const [first] = value.items;
  return (
    isRecord(first) && isRecord(first.id) && isNonEmptyText(first.id.videoId)
  );
}
