import Link from "next/link";
import { BiDonateHeart } from "react-icons/bi";

export default function CreatorSupport() {
  return (
    <article className="border-2 border-white rounded-md p-2 my-4">
      <h2 className="relative -top-6 bg-[var(--white)] text-[var(--grey)] w-56 left-5 rounded-md text-[16px] justify-center flex gap-4 items-center">
        <p>Apoie o criador</p>
        <BiDonateHeart size={20} />
      </h2>
      <div className="flex flex-col justify-center items-center md:items-stretch gap-4 md:flex md:flex-row">
        <p className="w-1/2 bg-white text-black p-4 rounded-md">{`Use code "UPETER-YT" na loja da epic games`}</p>
        <p className="w-1/2 bg-white text-black p-4 rounded-md">
          <Link
            href="https://livepix.gg/upeter"
            target="__blank"
            className="underline"
          >
            Envie uma donate para o streamer
          </Link>
        </p>
      </div>
    </article>
  );
}
