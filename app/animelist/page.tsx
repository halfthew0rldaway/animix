import AnimeListClient from "../components/AnimeListClient";
import Navbar from "../components/Navbar";
import { AuthUserSession } from "../libs/auth-libs";
import { buildApiUrl, getApiBase, safeFetchJson } from "../libs/api";

type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  type?: string | null;
};

type AnimeListResponse = {
  result?: { animes?: AnimeItem[] };
  animes?: AnimeItem[];
  data?: { animes?: AnimeItem[] };
};

const extractAnimes = (payload: AnimeListResponse): AnimeItem[] => {
  return (
    payload.result?.animes ?? payload.animes ?? payload.data?.animes ?? []
  );
};

export default async function AnimeListPage() {
  const session = await AuthUserSession();
  const initialLetter = "A";
  const initialPage = 1;

  let initialAnimes: AnimeItem[] = [];
  let apiBase = "";

  try {
    apiBase = getApiBase();
    const res = await safeFetchJson<AnimeListResponse>(
      buildApiUrl(`/animelist?letter=${initialLetter}&page=${initialPage}`),
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      initialAnimes = extractAnimes(res.data);
    }
  } catch (error) {
    initialAnimes = [];
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            A - Z Index
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Anime List
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Browse the catalog without the chaos.
          </p>
        </div>
        {apiBase ? (
          <AnimeListClient
            initialLetter={initialLetter}
            initialPage={initialPage}
            initialAnimes={initialAnimes}
          />
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            API is unavailable. Check your .env configuration.
          </div>
        )}
      </main>
    </div>
  );
}
