import { randomUUID } from "crypto";
import { FaDiscord, FaInstagram, FaTwitch, FaYoutube } from "react-icons/fa";
import LinkComponent from "./LinkComponent";

export default function SocialMediaIcons() {
  const socialMediaData = [
    {
      id: randomUUID(),
      href: "https://www.youtube.com/@UPeter",
      icon: <FaYoutube size={28} />,
    },
    {
      id: randomUUID(),
      href: "https://www.youtube.com/@opitaozera",
      icon: <FaYoutube size={28} />,
    },
    {
      id: randomUUID(),
      href: "https://www.instagram.com/upeter_r/",
      icon: <FaInstagram size={28} />,
    },
    {
      id: randomUUID(),
      href: "https://www.twitch.tv/opitaozera",
      icon: <FaTwitch size={28} />,
    },
    {
      id: randomUUID(),
      href: "https://discord.gg/kTHb8aeYnC",
      icon: <FaDiscord size={28} />,
    },
  ];

  return (
    <nav className={`flex gap-4 `}>
      {socialMediaData.map((item) => (
        <LinkComponent href={item.href} key={item.id}>
          {item.icon}
        </LinkComponent>
      ))}
    </nav>
  );
}
