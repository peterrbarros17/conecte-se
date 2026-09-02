import { FaDiscord, FaInstagram, FaTwitch, FaYoutube } from "react-icons/fa";
import type { IconType } from "react-icons";

type SocialLink = {
  icon: IconType;
  href: string;
  title: string;
  ariaLabel: string;
  className: string;
};

const socialLinks: SocialLink[] = [
  {
    icon: FaYoutube,
    href: "https://www.youtube.com/@UPeter",
    title: "Principal",
    ariaLabel: "YouTube — canal principal",
    className:
      "hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500",
  },
  {
    icon: FaYoutube,
    href: "https://www.youtube.com/@upeter0",
    title: "Secundário",
    ariaLabel: "YouTube — canal secundário",
    className:
      "hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500",
  },
  {
    icon: FaInstagram,
    href: "https://www.instagram.com/upeter_r/",
    title: "Instagram",
    ariaLabel: "Instagram",
    className:
      "hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-500",
  },
  {
    icon: FaTwitch,
    href: "https://www.twitch.tv/upeter0",
    title: "Twitch",
    ariaLabel: "Twitch",
    className:
      "hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400",
  },
  {
    icon: FaDiscord,
    href: "https://discord.gg/kTHb8aeYnC",
    title: "Discord",
    ariaLabel: "Discord",
    className:
      "hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-400",
  },
];

export default function SocialMediaIcons() {
  return (
    <nav aria-label="Redes sociais">
      <ul className="grid grid-cols-5 gap-2">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <li key={social.href}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.ariaLabel}
                aria-label={social.ariaLabel}
                className="group flex flex-col items-center gap-1.5 text-muted transition hover:text-ink"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-hairline bg-elevated/80 text-ink shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-glow ${social.className}`}
                >
                  <Icon size={18} />
                </span>
                <span className="text-center text-[10px] font-medium leading-tight">
                  {social.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
