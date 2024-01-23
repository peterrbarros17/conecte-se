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
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["700"],
  subsets: ["latin"],
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="z-10 max-w-[420px] gap-4 w-full flex flex-col text-center items-center justify-center bg-[#222] px-10 py-4 rounded-xl">
        <header className="flex flex-col items-center justify-center gap-2">
          <Image alt="creator" src={creator} className="w-40 rounded-full" />
          <h1 className="text-2xl">UPeter</h1>
          <div className="flex items-center text-sm gap-4">
            <div className="flex items-center gap-2">
              <FaCheckCircle size={18} />
              <p className="tracking-wider">Youtube, Streaming</p>
            </div>
            <div className="flex items-center gap-2">
              <FaLocationDot size={18} />
              <p className="tracking-wider">Fortaleza, Brasil</p>
            </div>
          </div>
          <p className="text-lime-500 p-2 text-[16px] italic tracking-wider">
            Amo jogos digitais e sou apaixado em transmitir isso atravez de
            lives.
          </p>
          <a
            href="mailto:upeter2019@gmail.com"
            target="_blank"
            className={`bg-lime-500 p-2 text-black rounded-lg hover:bg-white hover:text-black transition-all ease-in duration-300 ${inter.className}`}
          >
            upeter2019@gmail.com
          </a>
        </header>
        <nav className={`flex flex-col gap-4 ${inter.className}`}>
          <Link
            href="https://www.youtube.com/@UPeter"
            target="_blank"
            className="bg-[#333] w-[300px] py-2 px-4 rounded-xl flex items-center justify-center gap-4"
          >
            <FaYoutube size={28} />
            <p>Youtube - Fortnite</p>
          </Link>

          <Link
            href="https://www.youtube.com/@opitaozera"
            target="_blank"
            className="bg-[#333] w-[300px] py-2 px-4 rounded-xl flex items-center justify-center gap-4"
          >
            <FaYoutube size={28} />
            <p>Youtube - Séries</p>
          </Link>

          <Link
            href="https://www.instagram.com/upeter_r/"
            target="_blank"
            className="bg-[#333] w-[300px] py-2 px-4 rounded-xl flex items-center justify-center gap-4"
          >
            <FaInstagram size={28} />
            <p>Instagram</p>
          </Link>

          <Link
            href="https://www.twitch.tv/opitaozera"
            target="_blank"
            className="bg-[#333] w-[300px] py-2 px-4 rounded-xl flex items-center justify-center gap-4"
          >
            <FaTwitch size={28} />
            <p>Twitch - OpitaoZera</p>
          </Link>

          <Link
            href="https://discord.gg/kTHb8aeYnC"
            target="_blank"
            className="bg-[#333] w-[300px] py-2 px-4 rounded-xl flex items-center justify-center gap-4"
          >
            <FaDiscord size={28} />
            <p>Discord - OpitaoZera</p>
          </Link>
        </nav>
      </div>
    </main>
  );
}
