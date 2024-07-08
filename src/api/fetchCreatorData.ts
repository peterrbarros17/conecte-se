import { CreatorDataType } from "@/types/creatorDataType";

export async function fetchCreatorData(): Promise<CreatorDataType> {
  const res = await fetch(
    `https://creator-data.s3.us-east-2.amazonaws.com/${process.env.S3_AWS}.json`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) console.log("Error");

  return res.json();
}
