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
      <div className="mx-auto flex w-full flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/"
          className={`font-brand text-sm md:text-base ${isReadPage || isMangaMode
            ? "font-black !text-[#ea580c] dark:!text-[#f97316] uppercase tracking-wider"
            : "text-zinc-900 dark:text-zinc-100"
            }`}
          style={isReadPage || isMangaMode ? { fontFamily: 'var(--font-jember), var(--font-display)', fontSize: '1.5rem', fontWeight: 'normal' } : undefined}
        >
          Animix
        </Link>
        <ModeToggle />
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
              {/* Manga Navigation */}
              <Link
                href="/manga"
                className={`group relative pb-1 transition ${pathname === "/manga"
                  ? "text-[#ea580c] dark:text-[#f97316]"
                  : "hover:text-[#ea580c] dark:hover:text-[#f97316]"
                  }`}
              >
                LOBI
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname === "/manga" ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
              <Link
                href="/manga/list"
                className={`group relative pb-1 transition ${pathname.startsWith("/manga/list")
                  ? "text-[#ea580c] dark:text-[#f97316]"
                  : "hover:text-[#ea580c] dark:hover:text-[#f97316]"
                  }`}
              >
                DAFTAR KOMIK
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname.startsWith("/manga/list") ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
              <Link
                href="/manga/history"
                className={`group relative pb-1 transition ${pathname.startsWith("/manga/history")
                  ? "text-[#ea580c] dark:text-[#f97316]"
                  : "hover:text-[#ea580c] dark:hover:text-[#f97316]"
                  }`}
              >
                RIWAYAT
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-[#ea580c] transition group-hover:scale-x-100 dark:bg-[#f97316] ${pathname.startsWith("/manga/history") ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
            </>
          ) : (
            <>
              {/* Anime Navigation */}
              <Link
                href="/"
                className={`group relative pb-1 transition ${pathname === "/"
                  ? "text-zinc-900 dark:text-white"
                  : "hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                LOBI
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname === "/" ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
              <Link
                href="/animelist"
                className={`group relative pb-1 transition ${pathname.startsWith("/animelist")
                  ? "text-zinc-900 dark:text-white"
                  : "hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                DAFTAR ANIME
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname.startsWith("/animelist") ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
              <Link
                href="/history"
                className={`group relative pb-1 transition ${pathname.startsWith("/history")
                  ? "text-zinc-900 dark:text-white"
                  : "hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                RIWAYAT
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${pathname.startsWith("/history") ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </Link>
            </>
          )}
        </nav>
        <form
          onSubmit={submitSearch}
          className="ml-auto flex w-full max-w-md flex-1 items-center gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={pathname.startsWith("/manga") ? "Cari komik..." : "Cari anime..."}
            className={`w-full px-4 py-2 text-sm transition-all duration-500 ease-in-out focus:outline-none ${isReadPage || isMangaMode
              ? "rounded-md border-2 border-[#9a3412] bg-white text-[#1a1510] placeholder:text-[#1a1510]/50 focus:border-[#ea580c] dark:border-[#c2410c] dark:bg-[#26160a] dark:text-[#fff0e0] dark:placeholder:text-[#fff0e0]/50"
              : "rounded-full border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
          />
          <button
            type="submit"
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
              ? "rounded-md border-2 border-[#9a3412] bg-[#ea580c] text-white hover:bg-[#c2410c] dark:border-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c]"
              : "rounded-full border border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-200"
              }`}
          >
            GAS
          </button>
        </form>
        <div className="flex items-center gap-3">
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
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
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
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ease-in-out hover:-translate-y-[1px] active:translate-y-0 ${isReadPage || isMangaMode
                ? "rounded-md border-2 border-[#9a3412] bg-[#ea580c] text-white hover:bg-[#c2410c] dark:border-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c]"
                : "rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                }`}
            >
              MASUK
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
