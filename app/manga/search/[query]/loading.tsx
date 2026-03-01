import { MangaLoader } from "@/app/components/FancyLoaders";

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#fffbf0] dark:bg-zinc-950">
            <MangaLoader />
        </div>
    );
}
