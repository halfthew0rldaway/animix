import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { AuthUserSession } from "../../../libs/auth-libs";
import { safeFetchJson } from "../../../libs/api";

type DonghuaEpisodeItem = {
    episode: string;
    slug: string;
    href: string;
};

type DonghuaGenreItem = {
    name: string;
    slug: string;
    href: string;
};

type DonghuaDetail = {
    title: string;
    alter_title?: string;
    poster: string;
    rating?: string;
    studio?: string;
    network?: string;
    released?: string;
    duration?: string;
    type?: string;
    episodes_count?: string;
    season?: string;
    country?: string;
    released_on?: string;
    updated_on?: string;
    genres?: DonghuaGenreItem[];
    synopsis?: string;
    episodes_list?: DonghuaEpisodeItem[];
    status?: string;
};

const stripHtml = (value: string) =>
    value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "").trim();

export default async function DonghuaDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await AuthUserSession();
    const { slug } = await params;

    let detail: DonghuaDetail | null = null;
    let error: string | null = null;

    try {
        const res = await safeFetchJson<DonghuaDetail>(
            `https://www.sankavollerei.com/anime/donghua/detail/${encodeURIComponent(slug)}`,
            { next: { revalidate: 300 } },
            { cacheKey: `donghua-detail-${slug}`, ttlMs: 300000, errorTtlMs: 20000 }
        );
        if (res.ok) {
            if (res.data?.title) {
                detail = res.data;
            } else {
                error = "Failed to load donghua detail";
            }
        } else {
            error = res.error || "Failed to load donghua detail";
        }
    } catch (err) {
        error = err instanceof Error ? err.message : "Failed to load detail";
    }

    const title = detail?.title ?? slug;
    const poster = detail?.poster ?? "";
    const synopsisRaw = detail?.synopsis ?? "";
    const synopsis = synopsisRaw ? stripHtml(synopsisRaw) : "";
    const genres = detail?.genres ?? [];
    const status = detail?.status ?? "";
    const totalEpisodes = detail?.episodes_count ?? "";

    const watchHref = detail?.episodes_list && detail.episodes_list.length > 0
        ? `/donghua/watch/${encodeURIComponent(detail.episodes_list[detail.episodes_list.length - 1].slug)}?slug=${encodeURIComponent(
            slug
        )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`
        : null; // Donghua API episodes_list usually has ep 1 at the end (descending) or start. We'll link to first logically. Wait, Anichin API usually sets latest episode first. Let's provide the last one in the array (episode 1) or first if it is episode 1.

    // Let's assume episode 1 is the last item in the list for most Donghua sites
    // If not, we can just use the last item which is usually ep 1
    const firstEpisodeSlug = detail?.episodes_list?.[detail.episodes_list.length - 1]?.slug || detail?.episodes_list?.[0]?.slug;
    const actualWatchHref = firstEpisodeSlug ? `/donghua/watch/${encodeURIComponent(firstEpisodeSlug)}?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}` : null;

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif transition-colors duration-300 w-full overflow-x-hidden">
            <Navbar user={session?.user ?? null} />

            {error ? (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="rounded-2xl border border-[#a83232]/50 bg-[#a83232]/10 p-8 text-center backdrop-blur-sm">
                        <p className="text-[#a83232]">Detail tidak tersedia. Silakan muat ulang.</p>
                    </div>
                </div>
            ) : null}

            {detail ? (
                <main className="relative pb-24">
                    {/* Hero Section */}
                    <section className="relative min-h-[55vh] flex flex-col justify-end overflow-hidden pb-16 pt-32 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto border-b border-[#e5dcd3] dark:border-[#3a3836]">
                        {poster ? (
                            <div className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.1]">
                                <img
                                    src={poster}
                                    alt={title}
                                    className="h-full w-full object-cover object-center blur-sm grayscale-[0.5]"
                                    loading="eager"
                                    fetchPriority="high"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#f7f5f0] via-[#f7f5f0]/50 to-transparent dark:from-[#151413] dark:via-[#151413]/50"></div>
                            </div>
                        ) : null}

                        <div className="relative z-10 w-full flex flex-col items-center text-center">
                            {detail.alter_title ? (
                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a857e] mb-4 font-bold select-none">
                                    {detail.alter_title}
                                </p>
                            ) : (
                                <div className="mb-4 h-8 w-[1px] bg-[#8a857e]" />
                            )}

                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-medium tracking-[0.05em] text-[#2c2a27] dark:text-[#e0dbd3] mb-8 leading-tight font-[family-name:Georgia,serif] break-words max-w-5xl drop-shadow-sm">
                                {title}
                            </h1>

                            {/* Genre badges */}
                            <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-3xl">
                                {genres.map((genre) => (
                                    <span
                                        key={genre.slug}
                                        className="px-5 py-2 border border-[#d6d0c4] dark:border-[#4a4846] rounded-full text-[10px] font-sans font-bold uppercase tracking-widest text-[#5c5852] dark:text-[#a09c95] bg-white/30 dark:bg-black/30 backdrop-blur-sm shadow-sm"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            {/* Action Bar */}
                            {actualWatchHref && (
                                <div className="flex justify-center w-full">
                                    <Link
                                        href={actualWatchHref}
                                        className="group relative flex items-center justify-center gap-3 bg-[#1c1b1a] dark:bg-[#e0dbd3] px-12 py-4 transition-transform duration-300 hover:scale-[1.03] shadow-xl w-full max-w-[320px]"
                                    >
                                        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#8a857e]/50"></div>
                                        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#8a857e]/50"></div>
                                        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#8a857e]/50"></div>
                                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#8a857e]/50"></div>

                                        <span className="text-[13px] font-bold uppercase tracking-[0.25em] font-sans text-white dark:text-black">
                                            MULAI NONTON
                                        </span>

                                        <svg className="w-4 h-4 text-white dark:text-black transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Content Section */}
                    <div className="px-4 sm:px-6 lg:px-10 py-16">
                        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-[1fr_350px] gap-16 items-start">

                            {/* Left Column */}
                            <div className="flex flex-col gap-16">

                                {/* Synopsis */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl italic font-normal tracking-widest uppercase decoration-1 underline-offset-8 decoration-[#8a857e]" style={{ textDecorationStyle: 'dashed' }}>SINOPSIS</h2>
                                    </div>
                                    {synopsis ? (
                                        <p className="text-sm md:text-base leading-[2.2] text-[#5c5852] dark:text-[#a09c95] text-justify font-serif">
                                            {synopsis}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-[#8a857e]">Sinopsis belum tersedia untuk arsip ini.</p>
                                    )}
                                </div>

                                {/* Episodes Section */}
                                {detail?.episodes_list && detail.episodes_list.length > 0 && (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-xl italic font-normal tracking-widest uppercase decoration-1 underline-offset-8 decoration-[#8a857e]" style={{ textDecorationStyle: 'dashed' }}>DAFTAR EPISODE</h2>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 w-full">
                                            {[...detail.episodes_list]
                                                .sort((a, b) => {
                                                    const getNum = (ep: any) => {
                                                        const match = (ep.episode || "").match(/\d+(\.\d+)?/) || (ep.slug || "").match(/episode?-?\s*(\d+(\.\d+)?)/i);
                                                        return match ? parseFloat(match[1] || match[0]) : 0;
                                                    };
                                                    return getNum(a) - getNum(b);
                                                })
                                                .map((episode) => {
                                                    // extract episode number roughly
                                                    const epMatch = episode.episode.match(/Episode\s(\d+(\.\d+)?)/i) || episode.slug.match(/episode?-?\s*(\d+(\.\d+)?)/i);
                                                    let epLabel = epMatch ? epMatch[1] : episode.episode;
                                                    if (epLabel.length > 20) {
                                                        epLabel = "EP";
                                                    }

                                                    return (
                                                        <Link
                                                            key={episode.slug}
                                                            href={`/donghua/watch/${encodeURIComponent(episode.slug)}?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`}
                                                            className="group flex flex-col items-center justify-center bg-transparent border border-[#e5dcd3] dark:border-[#3a3836] py-3 px-2 text-center transition-all duration-300 hover:bg-[#1c1b1a] hover:border-[#1c1b1a] dark:hover:bg-[#e0dbd3] dark:hover:border-[#e0dbd3]"
                                                        >
                                                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a857e] group-hover:text-[#8a857e] dark:group-hover:text-[#5c5852] font-sans font-bold transition-colors">
                                                                EPISODE
                                                            </span>
                                                            <span className="text-xl font-serif mt-0.5 text-[#2c2a27] dark:text-[#dbd7d2] group-hover:text-[#f7f5f0] dark:group-hover:text-[#1c1b1a] transition-colors leading-none">
                                                                {epLabel}
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Info */}
                            <div className="flex flex-col gap-10 lg:sticky lg:top-24">
                                {/* Poster */}
                                {poster && (
                                    <div className="relative aspect-[2/3] w-full overflow-hidden border-4 border-[#e5dcd3] dark:border-[#3a3836] shadow-lg max-w-[300px] mx-auto">
                                        <img
                                            src={poster}
                                            alt={title}
                                            className="w-full h-full object-cover grayscale-[0.1]"
                                        />
                                    </div>
                                )}

                                {/* Meta details */}
                                <div className="flex flex-col gap-4 border-t border-[#e5dcd3] dark:border-[#3a3836] pt-6 uppercase tracking-widest text-xs font-sans">

                                    {detail.status && (
                                        <div className="flex justify-between items-center py-2 border-b border-[#e5dcd3] dark:border-[#3a3836]/50">
                                            <span className="text-[#8a857e]">Status</span>
                                            <span className="text-[#2c2a27] dark:text-[#dbd7d2] font-bold">{detail.status}</span>
                                        </div>
                                    )}

                                    {detail.studio && (
                                        <div className="flex justify-between items-center py-2 border-b border-[#e5dcd3] dark:border-[#3a3836]/50">
                                            <span className="text-[#8a857e]">Studio</span>
                                            <span className="text-[#2c2a27] dark:text-[#dbd7d2] font-bold text-right pl-4">{detail.studio}</span>
                                        </div>
                                    )}

                                    {detail.released && (
                                        <div className="flex justify-between items-center py-2 border-b border-[#e5dcd3] dark:border-[#3a3836]/50">
                                            <span className="text-[#8a857e]">Rilis</span>
                                            <span className="text-[#2c2a27] dark:text-[#dbd7d2] font-bold text-right pl-4">{detail.released}</span>
                                        </div>
                                    )}

                                    {detail.duration && (
                                        <div className="flex justify-between items-center py-2 border-b border-[#e5dcd3] dark:border-[#3a3836]/50">
                                            <span className="text-[#8a857e]">Durasi</span>
                                            <span className="text-[#2c2a27] dark:text-[#dbd7d2] font-bold">{detail.duration}</span>
                                        </div>
                                    )}

                                    {totalEpisodes && (
                                        <div className="flex justify-between items-center py-2 border-b border-[#e5dcd3] dark:border-[#3a3836]/50">
                                            <span className="text-[#8a857e]">Total Ep</span>
                                            <span className="text-[#2c2a27] dark:text-[#dbd7d2] font-bold">{detail.episodes_count}</span>
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            ) : (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <p className="text-[#8a857e] tracking-widest uppercase">Arsip tidak ditemukan.</p>
                </div>
            )}

            <Footer />
        </div>
    );
}
