import CreatorSupport from "@/components/CreatorSupport";
import ReleasedVideos from "@/components/ReleasedVideos";
import CreatorInformation from "@/components/CreatorInformation/index";
import SocialMediaIcons from "@/components/SocialMediaIcons";
import Image from "next/image";

export default async function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light dark:from-primary-dark dark:to-secondary-dark py-10">
      <div className="w-full max-w-xl lg:max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="relative h-32 bg-gradient-to-r from-primary-light to-secondary-light dark:from-primary-dark dark:to-secondary-dark">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden">
                <Image
                  src={"https://creator-photo.s3.us-east-2.amazonaws.com/EU.png"}
                  alt="UPeter"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">UPeter</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              🎮 Youtuber, Streamer | 📍 Fortaleza, Brasil
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Amo jogos digitais e compartilhar minha paixão através de livestreams.
            </p>

            <div className="flex justify-center gap-4 mt-6">
              <SocialMediaIcons />
            </div>

            <div className="mt-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h2 className="text-gray-700 dark:text-gray-300 font-semibold mb-4">Apoie o Criador</h2>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="block w-full bg-primary-light hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                  >
                    Use code &quot;UPETER-YT&quot; na loja da epic games
                  </a>
                  <a
                    href="https://livepix.gg/upeter"
                    target="_blank"
                    className="block w-full bg-secondary-light hover:bg-secondary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                  >
                    Envie uma doação
                  </a>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 md:p-6">
                <h2 className="text-gray-700 dark:text-gray-300 font-semibold mb-2 md:mb-4">Últimos Vídeos</h2>
                <div className="space-y-4">
                  <ReleasedVideos />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
