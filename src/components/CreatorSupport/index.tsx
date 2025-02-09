import Link from "next/link";

export default function CreatorSupport() {
  return (
    <div className="space-y-3 w-full">
      <p 
        className="block w-full bg-primary-light hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
      >
        Use code &quot;UPETER-YT&quot; na loja da epic games
      </p>
      <Link 
        href="https://livepix.gg/upeter"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-secondary-light hover:bg-secondary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
      >
        Envie uma donate para o streamer
      </Link>
    </div>
  );
}
