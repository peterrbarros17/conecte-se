import { randomUUID } from "crypto";
import { FaDiscord, FaInstagram, FaTwitch, FaYoutube } from "react-icons/fa";
import LinkComponent from "./LinkComponent";

export default function SocialMediaIcons() {
  const socialLinks = [
    {
      icon: 'youtube',
      href: 'https://www.youtube.com/@UPeter',
      color: 'text-red-600',
      title: 'Canal Principal'
    },
    {
      icon: 'youtube',
      href: 'https://www.youtube.com/@opitaozera',
      color: 'text-red-600',
      title: 'Canal Secundário'
    },
    {
      icon: 'instagram',
      href: 'https://www.instagram.com/upeter_r/',
      color: 'text-pink-600',
      title: 'Instagram'
    },
    {
      icon: 'twitch',
      href: 'https://www.twitch.tv/opitaozera',
      color: 'text-purple-600',
      title: 'Twitch'
    },
    {
      icon: 'discord',
      href: 'https://discord.gg/kTHb8aeYnC',
      color: 'text-indigo-600',
      title: 'Discord'
    },
  ];

  return (
    <div className="flex gap-6">
      {socialLinks.map((social) => (
        <a
          key={social.href}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          title={social.title}
          className={`${social.color} hover:opacity-75 transition-opacity`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <i className={`fab fa-${social.icon} text-xl`}></i>
          </div>
        </a>
      ))}
    </div>
  );
}
