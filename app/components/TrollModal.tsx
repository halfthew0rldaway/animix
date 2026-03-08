"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type TrollModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function TrollModal({ isOpen, onClose }: TrollModalProps) {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    const isDonghua = pathname.startsWith("/donghua");
    const isManga = pathname.startsWith("/manga");

    const themes = {
        donghua: {
            overlay: "bg-[#1c1b1a]/80 backdrop-blur-3xl",
            card: "bg-[#f7f5f0] border-[#e5dcd3] shadow-[0_40px_100px_-20px_rgba(28,27,26,0.3)]",
            title: "text-[#2c2a27] font-serif italic tracking-tighter",
            body: "text-[#5c5852] font-serif",
            mute: "text-[#8a857e] font-serif italic",
            btn: "bg-[#1c1b1a] text-[#f7f5f0] border-[#1c1b1a]",
            glow: "bg-[#8a857e]/5",
            accent: "border-[#e5dcd3]",
            tag: "DONGHUA_ARCHIVE",
            msg: "Nggak perlu login. Nonton mah tinggal nonton, gak bakal dapet berkah juga kalo lu login. Lagian opini lu soal donghua ini gak ada yang peduli."
        },
        manga: {
            overlay: "bg-[#1a1510]/80 backdrop-blur-3xl",
            card: "bg-[#fffbf0] border-2 border-[#9a3412] shadow-[0_40px_100px_-20px_rgba(154,52,18,0.3)]",
            title: "text-[#1a1510] font-black tracking-tighter uppercase italic",
            body: "text-[#1a1510]/80 font-bold tracking-tight",
            mute: "text-[#9a3412]/70 font-bold uppercase tracking-widest",
            btn: "bg-[#ea580c] text-white border-[#9a3412] shadow-[4px_4px_0px_#9a3412]",
            glow: "bg-[#ea580c]/5",
            accent: "border-[#9a3412]/20",
            tag: "COMIC_CORE",
            msg: "Nggak usah login. Baca tinggal baca, gak bakal dapet apa-apa juga kalo lu login. Lagian bacotan lu di sini gak ada yang baca."
        },
        anime: {
            overlay: "bg-black/90 backdrop-blur-3xl",
            card: "bg-[#0c0c0e] border border-zinc-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]",
            title: "text-white font-black tracking-tighter uppercase italic",
            body: "text-zinc-400 font-medium tracking-tight",
            mute: "text-zinc-600 font-bold uppercase tracking-[0.3em]",
            btn: "bg-white text-black border-white hover:bg-zinc-200 shadow-xl shadow-white/5",
            glow: "bg-white/5",
            accent: "border-zinc-800",
            tag: "ANIMIX_CORE",
            msg: "Nggak perlu login. Nonton tinggal nonton, gak usah ribet pengen login segala. Dan jujur, kita gak butuh-butuh amat sama opini kalian."
        }
    };

    const active = isDonghua ? themes.donghua : isManga ? themes.manga : themes.anime;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500 ${active.overlay}`}
            onClick={onClose}
        >
            <div
                className={`relative max-w-sm w-full p-1 border overflow-hidden rounded-[2.5rem] transform transition-all animate-in zoom-in-95 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${active.card}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fancy Inner Glow */}
                <div className={`absolute inset-0 z-0 opacity-40 ${active.glow}`} />

                <div className="relative z-10 p-8 flex flex-col items-center">
                    {/* Section Marker */}
                    <div className={`w-full flex justify-between items-center mb-12 pb-4 border-b ${active.accent}`}>
                        <span className={`text-[9px] font-mono tracking-[0.4em] ${active.mute}`}>
                            AUTH_DISABLED
                        </span>
                        <span className={`text-[9px] font-mono tracking-[0.4em] ${active.mute}`}>
                            {active.tag}
                        </span>
                    </div>

                    <div className="w-full space-y-10">
                        <div className="space-y-4">
                            <h2 className={`text-4xl leading-none animate-in slide-in-from-bottom-2 duration-500 fill-mode-both`}>
                                {active.title.includes("serif") ? "Aduh." : "ADUH."}
                            </h2>
                            <div className={`h-1 w-10 ${isManga ? "bg-[#ea580c]" : isDonghua ? "bg-[#2c2a27]" : "bg-white"}`} />
                        </div>

                        <div className="space-y-6">
                            <p className={`text-lg leading-relaxed animate-in slide-in-from-bottom-3 delay-100 duration-700 fill-mode-both ${active.body}`}>
                                {active.msg.split(". ").slice(0, 2).join(". ")}.
                            </p>

                            <div className={`pt-6 border-t ${active.accent}`}>
                                <p className={`text-[10px] leading-loose animate-in slide-in-from-bottom-4 delay-200 duration-1000 fill-mode-both ${active.mute}`}>
                                    {active.msg.split(". ").slice(2).join(". ")}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`group relative w-full py-5 text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] duration-300 ${active.btn}`}
                            >
                                <span className="relative z-10">LANJUTIN AJA</span>
                            </button>

                            <p className={`text-center text-[8px] font-bold uppercase tracking-widest opacity-30 ${active.mute}`}>
                                Click anywhere to dismiss
                            </p>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className={`absolute -bottom-12 -right-12 w-32 h-32 opacity-10 rounded-full blur-3xl ${active.glow}`} />
                <div className={`absolute -top-12 -left-12 w-32 h-32 opacity-10 rounded-full blur-3xl ${active.glow}`} />
            </div>
        </div>
    );
}
