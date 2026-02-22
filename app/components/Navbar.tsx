"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import ModeToggle from "./ModeToggle";

type NavbarProps = {
  user?: { name?: string | null; image?: string | null } | null;
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useSession();
  const [query, setQuery] = useState("");

  const activeUser = useMemo(() => data?.user ?? user ?? null, [data, user]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const searchPath = pathname.startsWith("/manga") ? "/manga/search" : "/search";
    router.push(`${searchPath}/${encodeURIComponent(trimmed)}`);
  };

  const isMangaMode = pathname.startsWith("/manga");
  const isReadPage = pathname.includes("/manga/read");

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${isReadPage || isMangaMode
        ? "bg-[#fffbf0] border-[#9a3412] text-[#1a1510]" /* Manga: Cream Bg, Rust Border, Black Text */
        : "bg-[#09090b] border-zinc-800 text-white" /* Anime: Dark Bg, Dark Border, White Text */
        }`}
    >
      <div className="mx-auto flex w-full items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className={`font-brand text-2xl tracking-wide ${isReadPage || isMangaMode
            ? "text-[#ea580c]"
            : "text-white"
            }`}
          style={{ fontFamily: 'var(--font-brand), sans-serif', fontWeight: 'normal' }}
        >
          Animix
        </Link>

        {/* WATCH/READ Toggle - Desktop only */}
        <div className="hidden md:block">
          <ModeToggle />
        </div>

        {/* Navigation Links - Desktop */}
        <nav
          className={`hidden items-center gap-6 text-xs font-bold uppercase tracking-widest md:flex ${isReadPage || isMangaMode
            ? "text-[#1a1510]"
            : "text-zinc-400"
            }`}
        >
          {pathname.startsWith("/manga") ? (
            <>
              <Link href="/manga" className={`transition-colors hover:text-[#ea580c] ${pathname === "/manga" ? "text-[#ea580c]" : ""}`}>
                Lobi
              </Link>
              <Link href="/manga/list" className={`transition-colors hover:text-[#ea580c] ${pathname.startsWith("/manga/list") ? "text-[#ea580c]" : ""}`}>
                Daftar Komik
              </Link>
              <Link href="/manga/history" className={`transition-colors hover:text-[#ea580c] ${pathname.startsWith("/manga/history") ? "text-[#ea580c]" : ""}`}>
                Riwayat
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={`transition-colors hover:text-white ${pathname === "/" ? "text-white" : ""}`}>
                Lobi
              </Link>
              <Link href="/animelist" className={`transition-colors hover:text-white ${pathname.startsWith("/animelist") ? "text-white" : ""}`}>
                Daftar Anime
              </Link>
              <Link href="/history" className={`transition-colors hover:text-white ${pathname.startsWith("/history") ? "text-white" : ""}`}>
                Riwayat
              </Link>
            </>
          )}
        </nav>

        {/* Search Bar */}
        <form
          onSubmit={submitSearch}
          className="flex flex-1 items-center gap-2 ml-auto max-w-sm lg:max-w-md"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={pathname.startsWith("/manga") ? "Cari komik..." : "Cari..."}
            className={`w-full px-4 py-2 text-sm transition-all duration-300 focus:outline-none border ${isReadPage || isMangaMode
              ? "rounded-md bg-white border-[#9a3412] text-[#1a1510] placeholder:text-zinc-400 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
              : "rounded-full bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:bg-black focus:border-zinc-700"
              }`}
          />
          <button
            type="submit"
            className={`hidden sm:block px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border shadow-sm ${isReadPage || isMangaMode
              ? "rounded-md bg-[#ea580c] border-[#ea580c] text-white hover:bg-[#c2410c]"
              : "rounded-full bg-white border-white text-black hover:bg-zinc-200"
              }`}
          >
            GAS
          </button>
        </form>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {activeUser ? (
            <>
              <div className="hidden items-center gap-3 text-sm font-medium md:flex">
                {activeUser.image ? (
                  <img
                    src={activeUser.image}
                    alt={activeUser.name ?? "User"}
                    className={`h-9 w-9 object-cover border ${isReadPage || isMangaMode ? "rounded-md border-[#9a3412]" : "rounded-full border-zinc-700"}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`flex h-9 w-9 items-center justify-center text-xs font-bold uppercase ${isReadPage || isMangaMode ? "rounded-md bg-white border border-[#9a3412] text-[#ea580c]" : "rounded-full bg-zinc-800 border border-zinc-700 text-white"}`}>
                    {activeUser.name?.slice(0, 1) ?? "U"}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className={`hidden md:block px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors border shadow-sm ${isReadPage || isMangaMode
                  ? "rounded-md border-[#9a3412] bg-white text-[#1a1510] hover:bg-[#fff0e0]"
                  : "rounded-full border-zinc-700 bg-black text-white hover:bg-zinc-900"
                  }`}
              >
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors border shadow-sm ${isReadPage || isMangaMode
                ? "rounded-md bg-[#18181b] border-[#18181b] text-white hover:bg-black"
                : "rounded-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                }`}
            >
              Masuk
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 items-center justify-items-center h-16 w-full border-t pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] transition-all md:hidden ${isReadPage || isMangaMode
        ? "border-[#9a3412] bg-[#fffbf0] text-[#1a1510]"
        : "border-zinc-800 bg-[#09090b] text-zinc-400"
        }`}>
        <Link
          href={isMangaMode ? "/manga" : "/"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${(isMangaMode ? pathname === "/manga" : pathname === "/")
            ? (isMangaMode ? "text-[#ea580c]" : "text-white font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-white")
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest">Lobi</span>
        </Link>

        <Link
          href={isMangaMode ? "/manga/list" : "/animelist"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${(isMangaMode ? pathname.startsWith("/manga/list") : pathname.startsWith("/animelist"))
            ? (isMangaMode ? "text-[#ea580c]" : "text-white font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-white")
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest">Daftar</span>
        </Link>

        {/* Mobile Mode Switcher - EXPLICIT BUTTON */}
        <Link
          href={isMangaMode ? "/" : "/manga"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${isMangaMode
            ? "text-zinc-400 hover:text-[#ea580c]"
            : "text-zinc-500 hover:text-white"
            }`}
        >
          {isMangaMode ? (
            /* Show TV icon to go to Anime */
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
            </svg>
          ) : (
            /* Show Book icon to go to Manga */
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          )}
          <span className="text-[10px] uppercase font-bold tracking-widest">{isMangaMode ? "Anime" : "Komik"}</span>
        </Link>

        <Link
          href={isMangaMode ? "/manga/history" : "/history"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${(isMangaMode ? pathname.startsWith("/manga/history") : pathname.startsWith("/history"))
            ? (isMangaMode ? "text-[#ea580c]" : "text-white font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-white")
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest">Riwayat</span>
        </Link>
      </nav>
    </header>
  );
}
