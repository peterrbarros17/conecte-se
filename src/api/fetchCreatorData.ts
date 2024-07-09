import { CreatorDataType } from "@/types/creatorDataType";

export async function fetchCreatorData(): Promise<CreatorDataType> {
  const res = await fetch(
    `https://gist.githubusercontent.com/peterrbarros17/409b13f0231a5a3b2ea2dbb5862c3039/raw/2386bd720578479b5b46f45f891ad2f86de4224d/${process.env.GIST}.json`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) console.log("Error");

  return res.json();
}
