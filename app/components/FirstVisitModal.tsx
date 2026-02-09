"use client";

import { useState, useEffect } from "react";

export default function FirstVisitModal() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const visited = localStorage.getItem("animix_visited_v4");
        if (!visited) {
            setTimeout(() => setShow(true), 1000);
        }
    }, []);

    const handleClose = () => {
        setShow(false);
        localStorage.setItem("animix_visited_v4", "true");
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-zinc-950/90 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl bg-white text-black overflow-hidden shadow-[16px_16px_0px_0px_#1a1a1a] border-4 border-black animate-scale-in">

                {/* Header Strip */}
                <div className="bg-black text-white px-8 py-5 flex items-center justify-between border-b-4 border-black">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest font-[family-name:var(--font-display)] flex items-center gap-3">
                        <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></span>
                        PEMBERITAHUAN SISTEM
                    </h2>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                        <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                    </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col gap-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter uppercase mb-2">
                            SELAMAT DATANG <br />
                            DI <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-zinc-800 to-zinc-500">ANIMIX</span>.
                        </h3>
                        <div className="h-2 w-32 bg-green-500 mt-4"></div>
                    </div>

                    <div className="text-lg md:text-xl font-bold space-y-6 text-zinc-800">
                        <p>
                            Platform streaming & baca komik ini tersedia <span className="bg-black text-white px-2 py-0.5 transform -skew-x-6 inline-block">GRATIS</span> untuk semua warga.
                        </p>

                        <div className="border-l-8 border-black pl-6 py-2 space-y-2 bg-zinc-50">
                            <p className="uppercase tracking-widest text-xs font-black text-zinc-400">ATURAN UTAMA</p>
                            <p>
                                Untuk menjaga kesehatan server, mohon <strong>TIDAK MELAKUKAN SPAM KLIK</strong> atau berpindah halaman secara agresif.
                            </p>
                        </div>

                        <p className="text-sm md:text-base text-zinc-600 font-medium italic">
                            "Pelan-pelan asal kelakon. Jika terkena Rate Limit, silakan rehat sejenak."
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full py-5 bg-black text-white font-black text-xl md:text-2xl uppercase tracking-[0.2em] hover:bg-green-600 hover:text-black transition-all border-4 border-transparent hover:border-black shadow-lg active:translate-y-1"
                    >
                        SIAP, LAKSANAKAN
                    </button>
                </div>
            </div>
        </div>
    );
}
