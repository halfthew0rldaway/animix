import Link from "next/link";

type DonghuaCardProps = {
    slug: string;
    title: string;
    poster: string;
    episode?: string | number | null;
    type?: string | null;
    releaseDay?: string | null;
    synopsis?: string | null;
    studio?: string | null;
};

export default function DonghuaCard({
    slug,
    title,
    poster,
    episode,
    type,
    releaseDay,
    synopsis,
    studio,
}: DonghuaCardProps) {
    return (
        <Link
            href={`/donghua/detail/${encodeURIComponent(slug)}`}
            prefetch={false}
            className="group flex flex-col gap-4 overflow-hidden bg-transparent transition-opacity duration-300 hover:opacity-90"
        >
            <div className="relative aspect-[2/3] overflow-hidden bg-[#e8e6e1] dark:bg-[#201e1d]">
                <img
                    src={poster || "/placeholder-donghua.svg"}
                    alt={title}
                    className="h-full w-full object-cover grayscale-[0.2] transition-transform duration-[800ms] group-hover:scale-[1.03] group-hover:grayscale-0"
                    loading="lazy"
                    decoding="async"
                />
                {(type || episode) && (
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2 text-[10px] font-sans tracking-widest text-[#2c2a27] dark:text-[#a09c95]">
                        {type ? (
                            <span className="bg-[#f4f1ea] px-3 py-1 shadow-sm dark:bg-[#1a1918]">
                                {type}
                            </span>
                        ) : null}
                        {episode ? (
                            <span className="bg-[#2c2a27] text-[#f4f1ea] px-3 py-1 shadow-sm dark:bg-[#dbd7d2] dark:text-[#1a1918]">
                                EP {episode}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5 px-1 pb-4">
                <h3 className="font-serif text-lg tracking-wide text-[#2c2a27] dark:text-[#dbd7d2] leading-tight"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}>
                    {title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans uppercase tracking-[0.1em] text-[#716c64] dark:text-[#8a857e]">
                    {studio ? <span>{studio}</span> : <span>Unknown Studio</span>}
                    {releaseDay ? <><span className="w-1 h-1 rounded-full bg-current opacity-50"></span><span>{releaseDay}</span></> : null}
                </div>
                {synopsis ? (
                    <p className="mt-2 text-sm text-[#5c5852] dark:text-[#a09c95] line-clamp-2" style={{ lineHeight: 1.6 }}>
                        {synopsis}
                    </p>
                ) : null}
            </div>
        </Link>
    );
}
