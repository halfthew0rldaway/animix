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
      className={`sticky top-0 z-40 border-b ${isReadPage
        ? "bg-[#fffbf0] border-[#9a3412] text-[#1a1510]"
        : isMangaMode
          ? "bg-[#fffbf0] border-[#9a3412] text-[#1a1510] dark:bg-[#1a110a] dark:text-[#fff0e0] dark:border-[#c2410c]"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
        }`}
    >
      <div className="mx-auto flex w-full items-center gap-6 px-3 py-2 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className={`font-brand text-sm md:text-base whitespace-nowrap ${isReadPage || isMangaMode
            ? "font-black !text-[#ea580c] dark:!text-[#f97316] uppercase tracking-wider"
            : "text-zinc-900 dark:text-zinc-100"
            }`}
          style={isReadPage || isMangaMode ? { fontFamily: 'var(--font-jember), var(--font-display)', fontSize: '1.25rem', fontWeight: 'normal' } : undefined}
        >
          Animix
        </Link>

        {/* WATCH/READ Toggle - Desktop only */}
        <ModeToggle />

        {/* Navigation Links - Desktop */}
        <nav
          className={`hidden items-center gap-5 text-xs uppercase tracking-[0.2em] md:flex ${isReadPage
            ? "text-[#1a1510] font-bold"
            : isMangaMode
              ? "text-[#1a1510]/70 dark:text-[#fff0e0]/70 font-bold"
              : "text-zinc-500 dark:text-zinc-400"
            }`}
        >
          {pathname.startsWith("/manga") ? (
            <>
              <Link href="/manga" className={`group relative pb-1 transition ${pathname === "/manga" ? "text-[#ea580c] dark:text-[#f97316]" : "hover:text-[#ea580c] dark:hover:text-[#f97316]"}`}>
                LOBI <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname === "/manga" ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
              <Link href="/manga/list" className={`group relative pb-1 transition ${pathname.startsWith("/manga/list") ? "text-[#ea580c] dark:text-[#f97316]" : "hover:text-[#ea580c] dark:hover:text-[#f97316]"}`}>
                DAFTAR KOMIK <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname.startsWith("/manga/list") ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
              <Link href="/manga/history" className={`group relative pb-1 transition ${pathname.startsWith("/manga/history") ? "text-[#ea580c] dark:text-[#f97316]" : "hover:text-[#ea580c] dark:hover:text-[#f97316]"}`}>
                RIWAYAT <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname.startsWith("/manga/history") ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={`group relative pb-1 transition ${pathname === "/" ? "text-zinc-900 dark:text-white" : "hover:text-zinc-900 dark:hover:text-white"}`}>
                LOBI <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname === "/" ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
              <Link href="/animelist" className={`group relative pb-1 transition ${pathname.startsWith("/animelist") ? "text-zinc-900 dark:text-white" : "hover:text-zinc-900 dark:hover:text-white"}`}>
                DAFTAR ANIME <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname.startsWith("/animelist") ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
              <Link href="/history" className={`group relative pb-1 transition ${pathname.startsWith("/history") ? "text-zinc-900 dark:text-white" : "hover:text-zinc-900 dark:hover:text-white"}`}>
                RIWAYAT <span className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname.startsWith("/history") ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
            </>
          )}
        </nav>

        {/* Search Bar - Takes remaining space */}
        <form
          onSubmit={submitSearch}
          className="flex flex-1 items-center gap-2 ml-auto max-w-md"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={pathname.startsWith("/manga") ? "Cari komik..." : "Cari..."}
            className={`w-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm transition-all duration-500 ease-in-out focus:outline-none ${isReadPage || isMangaMode
              ? "rounded-md border-2 border-[#9a3412] bg-zinc-50 text-[#1a1510] placeholder:text-zinc-500 focus:border-[#ea580c] dark:border-[#c2410c] dark:bg-zinc-900 dark:text-[#fff0e0] dark:placeholder:text-zinc-500"
              : "rounded-full border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
          />
          <button
            type="submit"
            className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
              ? "rounded-md border-2 border-[#9a3412] bg-[#ea580c] text-white hover:bg-[#c2410c] dark:border-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c]"
              : "rounded-full border border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-200"
              }`}
          >
            GAS
          </button>
        </form>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {activeUser ? (
            <>
              <div className="hidden items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
                {activeUser.image ? (
                  <img
                    src={activeUser.image}
                    alt={activeUser.name ?? "User"}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {activeUser.name?.slice(0, 1) ?? "U"}
                  </div>
                )}
                <span className="max-w-[140px] truncate">{activeUser.name ?? "Warga Aktif"}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className={`hidden md:block px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
                  ? "rounded-md border-2 border-[#9a3412] bg-[#ea580c] text-white hover:bg-[#c2410c] dark:border-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c]"
                  : "rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                  }`}
              >
                KELUAR
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              className={`whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
                ? "rounded-md border-2 border-[#9a3412] bg-[#ea580c] text-white hover:bg-[#c2410c] dark:border-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c]"
                : "rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                }`}
            >
              MASUK
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t px-4 pb-safe bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all md:hidden ${isReadPage || isMangaMode
        ? "border-[#9a3412] bg-[#fffbf0] text-[#1a1510] dark:border-[#c2410c] dark:bg-[#1a110a] dark:text-[#fff0e0]"
        : "border-zinc-200 bg-white/80 backdrop-blur-md text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400"
        }`}>
        <Link
          href={isMangaMode ? "/manga" : "/"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${(isMangaMode ? pathname === "/manga" : pathname === "/")
            ? (isMangaMode ? "text-[#ea580c] dark:text-[#f97316]" : "text-zinc-900 dark:text-zinc-100 font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-zinc-900 dark:hover:text-zinc-100")
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
            ? (isMangaMode ? "text-[#ea580c] dark:text-[#f97316]" : "text-zinc-900 dark:text-zinc-100 font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-zinc-900 dark:hover:text-zinc-100")
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest">Daftar</span>
        </Link>

        {/* Mode Switcher */}
        <Link
          href={isMangaMode ? "/" : "/manga"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v12" /><path d="M16 3v12" /><path d="M3 3h18" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M12 3v12" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-widest">{isMangaMode ? "Anime" : "Manga"}</span>
        </Link>

        <Link
          href={isMangaMode ? "/manga/history" : "/history"}
          className={`group flex flex-col items-center gap-1 p-2 transition-all active:scale-95 ${(isMangaMode ? pathname.startsWith("/manga/history") : pathname.startsWith("/history"))
            ? (isMangaMode ? "text-[#ea580c] dark:text-[#f97316]" : "text-zinc-900 dark:text-zinc-100 font-bold")
            : (isMangaMode ? "hover:text-[#ea580c]" : "hover:text-zinc-900 dark:hover:text-zinc-100")
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
