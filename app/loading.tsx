import { AnimeLoader } from "@/app/components/FancyLoaders";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <AnimeLoader title="LOADING ANIMIX..." />
    </div>
  );
}
