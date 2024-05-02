import Image from "next/image";
import creator from "@/assets/streamer.png";
import Link from "next/link";
import {
  FaCheckCircle,
  FaDiscord,
  FaInstagram,
  FaTwitch,
  FaYoutube,
} from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { BiDonateHeart } from "react-icons/bi";

export default function Home() {
  return (
    <main className="flex items-center justify-center tracking-wide relative bg-[url('https://wallpapers.com/images/hd/aesthetic-computer-4k-c9qdhe02pr84wh3a.jpg')] bg-cover bg-no-repeat bg-center">
      <div className="z-10 w-[50em] gap-10 flex flex-col text-center items-center bg-slate-900 md:bg-slate-800 bg-opacity-55 justify-center p-2 md:p-10 md:rounded-xl mb-20">
        <header className="flex flex-col items-center justify-center gap-2">
          <Image
            alt="creator content upeter"
            src={creator}
            className="w-40 rounded-full"
            width={595}
            height={598}
            priority={true}
          />
          <h1 className={`text-xl `}>UPeter</h1>
          <div className="flex items-center text-[16px] gap-4 ">
            <div className="flex items-center gap-2">
              <FaCheckCircle size={18} />
              <p className="">Youtuber, Streamer</p>
            </div>
            <div className="flex items-center gap-2">
              <FaLocationDot size={18} />
              <p className="">Fortaleza, Brasil</p>
            </div>
          </div>
          <p className="text-[var(--green)] p-2 text-[16px] bg-opacity-80 bg-slate-700 rounded-md">
            Amo jogos digitais e sou apaixonado em transmitir isso através de
            livestream.
          </p>
          <a
            href="mailto:upeter2019@gmail.com"
            target="_blank"
            className={`bg-[var(--grey)] p-2 text-[var(--white)] rounded-lg hover:bg-white hover:text-[var(--off-black)] transition-all ease-in duration-300 `}
          >
            upeter2019@gmail.com
          </a>
        </header>
        <nav className={`flex gap-4 `}>
          <Link
            href="https://www.youtube.com/@UPeter"
            target="_blank"
            className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
          >
            <FaYoutube size={28} />
          </Link>

          <Link
            href="https://www.youtube.com/@opitaozera"
            target="_blank"
            className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
          >
            <FaYoutube size={28} />
          </Link>

          <Link
            href="https://www.instagram.com/upeter_r/"
            target="_blank"
            className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
          >
            <FaInstagram size={28} />
          </Link>

          <Link
            href="https://www.twitch.tv/opitaozera"
            target="_blank"
            className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
          >
            <FaTwitch size={28} />
          </Link>

          <Link
            href="https://discord.gg/kTHb8aeYnC"
            target="_blank"
            className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
          >
            <FaDiscord size={28} />
          </Link>
        </nav>
        <article className="border-2 border-white rounded-md p-2 my-4">
          <h2 className="relative -top-6 bg-[var(--white)] text-[var(--grey)] w-56 left-5 rounded-md text-[16px] justify-center flex gap-4 items-center">
            <p>Me apoie</p>
            <BiDonateHeart size={20} />
          </h2>
          <div className="flex flex-col justify-center items-center md:items-stretch gap-4 md:flex md:flex-row">
            <p className="w-1/2 bg-white text-black p-4  rounded-md">{`Use code "UPETER-YT" na loja da epic games`}</p>
            <p className="w-1/2 bg-white text-black p-4  rounded-md">
              Envie uma{" "}
              <a
                href="https://livepix.gg/upeter"
                target="__blank"
                className="underline"
              >
                donate
              </a>{" "}
              para o streamer
            </p>
          </div>
        </article>
        <section>
          <ul className="text-2xl flex flex-col gap-4">
            <li className="">
              <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
                Último vídeo
              </h1>
              <iframe
                className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
                src="https://www.youtube.com/embed/8izaq1g6Ez4?si=WzYAwKuZLMuTRXfE"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </li>
            <li>
              <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
                Última live
              </h1>
              <iframe
                className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
                src="https://www.youtube.com/embed/nlqc53O0GyU?si=bLzV6uX7L0nRzmqf"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </li>
            <li>
              <h1 className="w-full bg-opacity-30 bg-slate-700 py-2">
                Última série
              </h1>
              <iframe
                className="w-[24rem] md:w-[560px] md:h-[315px] h-[20rem]"
                src="https://www.youtube.com/embed/Na6NtZmx5Vc?si=VNHXL6XmA5FlhmNi"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
