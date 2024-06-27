import NavIcons from "@/components/NavIcons";
import CreatorSupport from "@/components/CreatorSupport";
import ReleasedVideos from "@/components/ReleasedVideos";
import CreatorInformation from "@/components/CreatorInformation";

export default async function Home() {
  return (
    <main className="flex items-center justify-center tracking-wide relative bg-[url('https://wallpapers.com/images/hd/aesthetic-computer-4k-c9qdhe02pr84wh3a.jpg')] bg-cover bg-no-repeat bg-center">
      <div className="z-10 w-[50em] gap-10 flex flex-col text-center items-center bg-slate-900 md:bg-slate-800 bg-opacity-55 justify-center p-2 md:p-10 md:rounded-xl mb-20">
        <CreatorInformation />

        <NavIcons />

        <CreatorSupport />

        <ReleasedVideos />
      </div>
    </main>
  );
}
