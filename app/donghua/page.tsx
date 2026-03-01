import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DonghuaSectionInfinite from "../components/DonghuaSectionInfinite";
import { AuthUserSession } from "../libs/auth-libs";
import { safeFetchJson } from "../libs/api";

type ApiDonghuaItem = {
    slug: string;
    title: string;
    poster: string;
    episode?: string | number | null;
    type?: string | null;
    release_day?: string | null;
    synopsis?: string | null;
    studio?: string | null;
};

type ApiListResponse = {
    status?: string;
    creator?: string;
    ongoing_donghua?: any[];
    completed_donghua?: any[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const extractItems = (list: any[]): ApiDonghuaItem[] => {
    return list.map((item) => {
        const title = item.title ?? item.name ?? "Untitled";
        const rawSlug = item.slug ?? item.animeId ?? item.id;
        const slug = rawSlug ? rawSlug.replace(/\/+$/, "") : normalize(title).replace(/\s+/g, "-");

        return {
            slug,
            title,
            poster: item.poster ?? item.image ?? item.thumbnail ?? item.cover ?? "",
            episode: item.episode ?? item.episodes ?? item.latestEpisode ?? null,
            type: item.type ?? item.format ?? "Donghua",
            release_day: item.release_day ?? item.day ?? null,
            synopsis: item.synopsis ?? item.description ?? null,
            studio: item.studio ?? item.studios ?? null,
        };
    });
};

export default async function DonghuaHome() {
    const session = await AuthUserSession();

    let ongoingItems: ApiDonghuaItem[] = [];
    let completedItems: ApiDonghuaItem[] = [];
    let ongoingError: string | null = null;
    let completedError: string | null = null;

    try {
        const [ongoingRes, completedRes] = await Promise.all([
            safeFetchJson<ApiListResponse>(
                "https://www.sankavollerei.com/anime/donghua/ongoing?page=1",
                { next: { revalidate: 300 } },
                { cacheKey: "donghua-home-ongoing", ttlMs: 300000, errorTtlMs: 20000 }
            ),
            safeFetchJson<ApiListResponse>(
                "https://www.sankavollerei.com/anime/donghua/completed?page=1",
                { next: { revalidate: 300 } },
                { cacheKey: "donghua-home-completed", ttlMs: 300000, errorTtlMs: 20000 }
            )
        ]);

        if (ongoingRes.ok) ongoingItems = extractItems(ongoingRes.data.ongoing_donghua ?? []);
        else ongoingError = ongoingRes.error || "Failed to load ongoing";

        if (completedRes.ok) completedItems = extractItems(completedRes.data.completed_donghua ?? []);
        else completedError = completedRes.error || "Failed to load completed";
    } catch (e) {
        ongoingError = "Failed to connect to archive.";
        completedError = "Failed to connect to archive.";
    }

    // Hero item
    const heroItems = [...ongoingItems, ...completedItems].slice(0, 10);
    const heroPoster = heroItems.length > 0 ? heroItems[0].poster : null;

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif transition-colors duration-300">
            <Navbar user={session?.user ?? null} />

            <main className="mx-auto flex-1 w-full flex-col gap-12 px-4 py-8 sm:px-6 lg:px-10 flex">
                <header className="relative flex flex-col items-center justify-center py-20 text-center animate-fade-in overflow-hidden border border-[#e5dcd3] dark:border-[#3a3836] rounded-2xl mx-4 sm:mx-6 lg:mx-10 mt-8">
                    {heroPoster && (
                        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]">
                            <img src={heroPoster} alt="Hero Background" className="w-full h-full object-cover blur-sm grayscale" />
                        </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-4 h-16 w-[1px] bg-[#8a857e]" />
                        <h1 className="text-4xl md:text-5xl font-medium tracking-[0.15em] text-[#2c2a27] dark:text-[#e0dbd3]" style={{ fontFamily: 'Georgia, serif' }}>
                            DONGHUA
                        </h1>
                        <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#5c5852] dark:text-[#a09c95]">
                            A curated archive of Chinese animation. Enter the world of martial arts, profound storytelling, and traditional aesthetics.
                        </p>
                        <div className="mt-8 h-8 w-[1px] bg-[#e5dcd3] dark:bg-[#3a3836]" />
                    </div>
                </header>

                <DonghuaSectionInfinite
                    title="Ongoing Series"
                    caption="Cultivation never stops. Currently transmitting."
                    initialDonghuas={ongoingItems}
                    initialPage={2}
                    fetchUrl="/api/donghua?type=ongoing"
                />

                <div className="w-full h-[1px] bg-[#e5dcd3] dark:bg-[#3a3836]" />

                <DonghuaSectionInfinite
                    title="Completed Epics"
                    caption="The journey has concluded. Archive complete."
                    initialDonghuas={completedItems}
                    initialPage={2}
                    fetchUrl="/api/donghua?type=completed"
                />

                <Footer />
            </main>
        </div>
    );
}
