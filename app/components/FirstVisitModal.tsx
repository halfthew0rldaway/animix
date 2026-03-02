"use client";

import { useState, useEffect } from "react";

export default function FirstVisitModal() {
    const [show, setShow] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Remove localStorage check to show on every hard refresh/first visit.
        const timer = setTimeout(() => {
            setShow(true);
            setTimeout(() => setMounted(true), 50);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setMounted(false);
        setTimeout(() => setShow(false), 300);
    };

    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
            <div
                className={`relative w-full max-w-2xl bg-[#0a0a0a] text-white border border-[#222] shadow-2xl transition-all duration-500 transform ${mounted ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
                style={{
                    boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)'
                }}
            >
                {/* Header Strip */}
                <div className="bg-[#111] px-6 py-4 flex items-center justify-between border-b border-[#222]">
                    <h2 className="text-xs md:text-sm font-bold text-gray-400 tracking-[0.3em] font-[family-name:var(--font-mono)] flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        SYSTEM_MSG // V.4.0
                    </h2>
                    <div className="flex gap-1.5 opacity-50">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-600 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="inline-block px-3 py-1 mb-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono uppercase tracking-widest rounded-sm">
                            Connection Established
                        </div>
                        <h3 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tighter uppercase font-[family-name:var(--font-display)]">
                            SELAMAT DATANG <br />
                            DI <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">ANIMIX</span>
                        </h3>
                        <div className="h-1 w-24 md:w-32 bg-orange-500 mt-4 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                    </div>

                    <div className="text-base md:text-lg space-y-6 text-gray-300 relative z-10 font-[family-name:var(--font-body)]">
                        <p className="leading-relaxed">
                            Platform streaming & baca komik ini tersedia <span className="font-bold text-white uppercase tracking-wider border-b border-white border-dashed">GRATIS</span> untuk semua warga.
                        </p>

                        <div className="border-l-2 border-emerald-500 pl-5 py-3 space-y-2 bg-[#111]/80 backdrop-blur-sm relative group overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                            <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-emerald-400 font-mono">ATURAN UTAMA</p>
                            <p className="text-sm md:text-base leading-relaxed text-gray-200">
                                Untuk menjaga kesehatan server, mohon <strong className="text-orange-400 font-bold tracking-wide">TIDAK MELAKUKAN SPAM KLIK</strong> atau berpindah halaman secara agresif.
                            </p>
                        </div>

                        <p className="text-xs md:text-sm text-gray-500 font-mono italic">
                            &gt; "Pelan-pelan asal kelakon. Jika terkena Rate Limit, silakan rehat sejenak." <span className="animate-pulse">_</span>
                        </p>
                    </div>

                    <div className="relative z-10 pt-4 flex justify-end">
                        <button
                            onClick={handleClose}
                            className="group relative px-8 py-4 bg-white text-black font-bold text-sm md:text-base uppercase tracking-[0.2em] overflow-hidden rounded-sm transition-all hover:bg-emerald-400 hover:text-black hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                SIAP, LAKSANAKAN
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
