import { fetchCreatorData } from "@/api/fetchCreatorData";
import Image from "next/image";

import { FaCheckCircle } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

export default async function CreatorInformation() {
  const creatorData = await fetchCreatorData();

  return (
    <header className="flex flex-col items-center justify-center gap-2">
      <Image
        alt="creator content upeter"
        src={"https://creator-photo.s3.us-east-2.amazonaws.com/EU.png"}
        className="w-40 rounded-full"
        width={595}
        height={598}
        priority={true}
      />
      <h1 className={`text-xl `}>{creatorData.creator.creatorName}</h1>
      <div className="flex items-center text-[16px] gap-4 ">
        <div className="flex items-center gap-2">
          <FaCheckCircle size={18} />
          <p className="">{creatorData.creator.creatorPlatform}</p>
        </div>
        <div className="flex items-center gap-2">
          <FaLocationDot size={18} />
          <p className="">{creatorData.creator.creatorLocation}</p>
        </div>
      </div>
      <p className="text-[var(--green)] p-2 text-[16px] bg-opacity-80 bg-slate-700 rounded-md">
        {creatorData.creator.creatorPhraseMotivation}
      </p>
      <a
        href="mailto:upeter2019@gmail.com"
        target="_blank"
        className={`bg-[var(--grey)] p-2 text-[var(--white)] rounded-lg hover:bg-white hover:text-[var(--off-black)] transition-all ease-in duration-300 `}
      >
        {creatorData.creator.creatorEmail}
      </a>
    </header>
  );
}
