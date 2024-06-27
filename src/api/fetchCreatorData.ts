import { CreatorDataType } from "@/types/creatorDataType";

export async function fetchCreatorData(): Promise<CreatorDataType> {
  const res = await fetch(
    `https://creator-data.s3.us-east-2.amazonaws.com/createData.json`
  );
  if (!res.ok) console.log("Error");

  return res.json();
}
