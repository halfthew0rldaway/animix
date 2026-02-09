import React from "react";

export function AnimeLoader({ title = "LOADING ANIMIX..." }: { title?: string }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-10 min-h-[50vh]">
            <div className="relative flex h-20 w-20 items-center justify-center">
                {/* Pulsing Glows */}
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20 duration-1000"></div>
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/10 delay-300 duration-1000"></div>

                {/* Spinning Rings */}
                <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-2 border-transparent border-t-green-500/50"></div>
                <div className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-transparent border-t-green-400/80"></div>

                {/* Center Play Icon */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 shadow-lg shadow-green-500/30">
                    <svg className="ml-1 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col items-center gap-1">
                <p className="animate-pulse text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                    {title}
                </p>
                <div className="flex gap-1">
                    <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce delay-100"></span>
                    <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce delay-200"></span>
                    <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce delay-300"></span>
                </div>
            </div>
        </div>
    );
}

export function MangaLoader({ title = "SABAR!!", subTitle = "AMBIL HALAMAN" }: { title?: string; subTitle?: string }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="relative overflow-hidden border-4 border-black bg-white p-12 shadow-[12px_12px_0_0_#000000] dark:border-zinc-200 dark:shadow-[12px_12px_0_0_#ffffff]">
                {/* Speed Lines Background */}
                <div className="absolute inset-0 -z-10 animate-[spin_10s_linear_infinite] opacity-10 bg-[repeating-conic-gradient(#000_0_15deg,transparent_15deg_30deg)] dark:bg-[repeating-conic-gradient(#000_0_15deg,transparent_15deg_30deg)]"></div>

                <div className="flex flex-col items-center gap-6">
                    {/* Bouncing Text */}
                    <div className="animate-bounce">
                        <h2 className="rotate-[-2deg] transform text-5xl font-black italic tracking-tighter text-black md:text-6xl"
                            style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}>
                            {title}
                        </h2>
                    </div>

                    {/* Comic Bubble Loader */}
                    <div className="flex items-center gap-2 rounded-full border-2 border-black bg-yellow-300 px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000000]">
                        <span className="animate-pulse">{subTitle}</span>
                        <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black delay-100"></span>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black delay-200"></span>
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black delay-300"></span>
                        </div>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute left-2 top-2 h-4 w-4 border-l-4 border-t-4 border-black"></div>
                <div className="absolute bottom-2 right-2 h-4 w-4 border-b-4 border-r-4 border-black"></div>
            </div>
        </div>
    );
}
