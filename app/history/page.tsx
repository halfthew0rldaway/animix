import Navbar from "../components/Navbar";
import { AuthUserSession } from "../libs/auth-libs";
import HistoryList from "../components/HistoryList";

export default async function HistoryPage() {
  const session = await AuthUserSession();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            History
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Watch History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Resume where you left off.
          </p>
        </div>
        <HistoryList title="Recently Watched" limit={20} />
      </main>
    </div>
  );
}
