"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export type AppMode = "anime" | "manga";

export default function ModeToggle() {
    const pathname = usePathname();
    const router = useRouter();
    const mode: AppMode = pathname.startsWith("/manga") ? "manga" : "anime";
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleModeChange = (newMode: AppMode) => {
        if (newMode === mode || isTransitioning) return;

        setIsTransitioning(true);

        // Navigate immediately without transition delay
        if (newMode === "manga") {
            router.push("/manga");
        } else {
            router.push("/");
        }

        // Reset transitioning state quickly
        setTimeout(() => {
            setIsTransitioning(false);
        }, 100);
    };

    return (
        <div className="mode-toggle-wrapper">
            <div className={`mode-toggle ${mode === "manga" ? "comic-mode" : ""}`}>
                <button
                    onClick={() => handleModeChange("anime")}
                    className={`mode-toggle-btn ${mode === "anime" ? "active" : ""}`}
                    disabled={isTransitioning}
                >
                    <span className="mode-icon"><i className="fa-solid fa-tv"></i></span>
                    <span className="mode-label">Watch</span>
                </button>
                <button
                    onClick={() => handleModeChange("manga")}
                    className={`mode-toggle-btn ${mode === "manga" ? "active" : ""}`}
                    disabled={isTransitioning}
                >
                    <span className="mode-icon"><i className="fa-solid fa-book-open"></i></span>
                    <span className="mode-label">Comic</span>
                </button>
                <div className={`mode-toggle-slider ${mode === "manga" ? "right" : "left"}`} />
            </div>
        </div>
    );
}
