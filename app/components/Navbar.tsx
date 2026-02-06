"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";

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
    router.push(`/search/${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="font-brand text-sm text-zinc-900 dark:text-zinc-100 md:text-base"
        >
          Animix
        </Link>
        <nav className="hidden items-center gap-5 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 md:flex">
          <Link
            href="/"
            className={`group relative pb-1 transition ${
              pathname === "/"
                ? "text-zinc-900 dark:text-white"
                : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Home
            <span
              className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${
                pathname === "/" ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
          <Link
            href="/animelist"
            className={`group relative pb-1 transition ${
              pathname.startsWith("/animelist")
                ? "text-zinc-900 dark:text-white"
                : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Anime List
            <span
              className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${
                pathname.startsWith("/animelist") ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
          <Link
            href="/history"
            className={`group relative pb-1 transition ${
              pathname.startsWith("/history")
                ? "text-zinc-900 dark:text-white"
                : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            History
            <span
              className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-zinc-900 transition group-hover:scale-x-100 dark:bg-white ${
                pathname.startsWith("/history") ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        </nav>
        <form
          onSubmit={submitSearch}
          className="ml-auto flex w-full max-w-md flex-1 items-center gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anime"
            className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 transition focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700 transition hover:-translate-y-[1px] hover:border-zinc-400 active:translate-y-0 dark:border-zinc-800 dark:text-zinc-200"
          >
            Go
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
                <span className="max-w-[140px] truncate">{activeUser.name ?? "Signed in"}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-[1px] hover:bg-zinc-700 active:translate-y-0 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn()}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-[1px] hover:bg-zinc-700 active:translate-y-0 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
