import Link from "next/link";
import { FaDiscord, FaInstagram, FaTwitch, FaYoutube } from "react-icons/fa";

export default function NavIcons() {
  return (
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
  );
}
