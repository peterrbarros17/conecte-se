import CreatorSupport from "@/components/CreatorSupport";
import {
  FeaturedVideo,
  LiveAndSeries,
  getReleasedVideos,
} from "@/components/ReleasedVideos";
import CreatorInformation from "@/components/CreatorInformation";
import SocialMediaIcons from "@/components/SocialMediaIcons";

export default async function Home() {
  const { latestVideo, latestLive, latestSerie } = await getReleasedVideos();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-canvas" />
        <div className="absolute -left-24 -top-32 h-[28rem] w-[28rem] animate-drift rounded-full bg-rose-500/25 blur-[120px] dark:bg-rose-500/20" />
        <div className="absolute -right-16 top-1/4 h-[24rem] w-[24rem] animate-drift rounded-full bg-violet-500/20 blur-[110px] [animation-delay:-6s] dark:bg-violet-500/25" />
        <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] animate-drift rounded-full bg-cyan-400/15 blur-[100px] [animation-delay:-11s] dark:bg-cyan-400/10" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-8">
          <aside className="animate-fade-up lg:row-span-2">
            <article className="glass-card flex h-full flex-col overflow-hidden">
              <CreatorInformation />
              <div className="mt-auto border-t border-hairline px-6 pb-7 pt-5 sm:px-8">
                <p className="section-label mb-3 text-center">Redes</p>
                <SocialMediaIcons />
              </div>
            </article>
          </aside>

          <FeaturedVideo videoId={latestVideo} />
          <CreatorSupport />
        </div>

        <div className="mt-6 lg:mt-8">
          <LiveAndSeries liveId={latestLive} serieId={latestSerie} />
        </div>

        <footer className="mt-12 text-center text-xs tracking-wide text-muted">
          <p>© 2026 UPeter · Conecte-se</p>
        </footer>
      </div>
    </main>
  );
}
