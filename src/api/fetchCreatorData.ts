import { CreatorDataType } from "@/types/creatorDataType";

export async function fetchCreatorData(): Promise<CreatorDataType> {
  const res = await fetch(
    `https://gist.githubusercontent.com/peterrbarros17/409b13f0231a5a3b2ea2dbb5862c3039/raw/2386bd720578479b5b46f45f891ad2f86de4224d/${process.env.GIST}.json`,
    // The Gist URL is pinned to a commit SHA, so its content is immutable.
    { next: { revalidate: false } }
  );
  if (!res.ok) {
    throw new Error(`GitHub Gist responded with ${res.status}`);
  }

  return res.json();
}
