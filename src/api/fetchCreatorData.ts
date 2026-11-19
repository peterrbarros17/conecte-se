import { fetchJsonWithTimeout, requireConfig } from "@/api/externalRequest";
import { isCreatorDataType } from "@/api/validation";
import type { CreatorDataType } from "@/types/creatorDataType";

export async function fetchCreatorData(): Promise<CreatorDataType> {
  const gistFile = requireConfig(process.env.GIST, "GIST");
  const data = await fetchJsonWithTimeout(
    `https://gist.githubusercontent.com/peterrbarros17/409b13f0231a5a3b2ea2dbb5862c3039/raw/2386bd720578479b5b46f45f891ad2f86de4224d/${gistFile}.json`,
    // The Gist URL is pinned to a commit SHA, so its content is immutable.
    { next: { revalidate: false } },
    "GitHub Gist"
  );

  if (!isCreatorDataType(data)) {
    throw new Error("GitHub Gist returned invalid data");
  }

  return data;
}
