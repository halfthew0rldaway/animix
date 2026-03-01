"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export type AppMode = "anime" | "manga" | "donghua";

export default function ModeToggle() {
    const pathname = usePathname();
    const router = useRouter();

    let mode: AppMode = "anime";
    if (pathname.startsWith("/manga")) mode = "manga";
    else if (pathname.startsWith("/donghua")) mode = "donghua";

    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleModeChange = (newMode: AppMode) => {
        if (newMode === mode || isTransitioning) return;

        setIsTransitioning(true);

        if (newMode === "manga") {
            router.push("/manga");
        } else if (newMode === "donghua") {
            router.push("/donghua");
        } else {
            router.push("/");
        }

        setTimeout(() => {
            setIsTransitioning(false);
        }, 100);
    };

    return (
        <div className="mode-toggle-wrapper">
            <div className={`mode-toggle ${mode === "manga" ? "comic-mode" : mode === "donghua" ? "donghua-mode" : ""} relative overflow-hidden`} style={{ width: "320px" }}>

                {/* Anime Button */}
                <button
                    onClick={() => handleModeChange("anime")}
                    className={`mode-toggle-btn ${mode === "anime" ? "active" : ""} group`}
                    disabled={isTransitioning}
                    style={{ flex: "1" }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${mode === "anime" ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"}`}>
                        <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
                    </svg>
                    <span className={`mode-label transition-all duration-300 ${mode === "anime" ? "scale-105" : "group-hover:scale-105"}`} style={{ fontSize: "10px" }}>Anime</span>
                </button>

                {/* Comic Button */}
                <button
                    onClick={() => handleModeChange("manga")}
                    className={`mode-toggle-btn ${mode === "manga" ? "active" : ""} group`}
                    disabled={isTransitioning}
                    style={{ flex: "1" }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${mode === "manga" ? "scale-110 drop-shadow-[2px_2px_0px_#ea580c] dark:drop-shadow-[2px_2px_0px_#ea580c]" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"}`}>
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    <span className={`mode-label transition-all duration-300 ${mode === "manga" ? "scale-105" : "group-hover:scale-105"}`} style={{ fontSize: "10px" }}>Comic</span>
                </button>

                {/* Donghua Button */}
                <button
                    onClick={() => handleModeChange("donghua")}
                    className={`mode-toggle-btn ${mode === "donghua" ? "active" : ""} group`}
                    disabled={isTransitioning}
                    style={{ flex: "1" }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-500 ${mode === "donghua" ? "scale-110 rotate-180 drop-shadow-[0_0_5px_#8a857e]" : "group-hover:scale-110 group-hover:rotate-90 opacity-70 group-hover:opacity-100"}`}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 2a5 5 0 0 0 0 10 5 5 0 0 1 0 10" /><circle cx="12" cy="7" r="2" fill="currentColor" /><circle cx="12" cy="17" r="2" fill="transparent" />
                    </svg>
                    <span className={`mode-label font-serif transition-all duration-300 ${mode === "donghua" ? "scale-105 tracking-[0.2em]" : "group-hover:scale-105 group-hover:tracking-[0.2em]"}`} style={{ fontSize: "10px" }}>Donghua</span>
                </button>

                {/* Slider Background that moves */}
                <div
                    className="mode-toggle-slider overflow-hidden flex items-center justify-center relative"
                    style={{
                        width: "calc(33.333% - 2px)",
                        left: "3px",
                        transform: mode === "anime" ? "translateX(0)" : mode === "manga" ? "translateX(100%)" : "translateX(200%)"
                    }}
                >
                    {/* Inner dynamic flair for each mode */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${mode === "anime" ? "opacity-100" : "opacity-0"}`}>
                        <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-zinc-500/20 blur-md pointer-events-none mix-blend-screen"></div>
                    </div>

                    <div className={`absolute inset-0 transition-opacity duration-300 ${mode === "manga" ? "opacity-100" : "opacity-0"} bg-[radial-gradient(circle_at_2px_2px,rgba(234,88,12,0.15)_1px,transparent_0)] bg-[size:6px_6px]`}>
                    </div>

                    <div className={`absolute inset-0 transition-opacity duration-300 ${mode === "donghua" ? "opacity-100" : "opacity-0"}`}>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#8a857e]/10 to-transparent"></div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#8a857e]/30 to-transparent"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}
