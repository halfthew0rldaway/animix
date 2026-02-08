import { fetchUnlimitedManga } from "@/app/libs/manga-api";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MangaCard from "@/app/components/MangaCard";
import { AuthUserSession } from "@/app/libs/auth-libs";

export const dynamic = "force-dynamic";

export default async function UnlimitedPage() {
    const session = await AuthUserSession();
    // Fetch unlimited manga (deep crawl mode effectively)
    // We can tune type and maxPages. Let's start with defaults (all, 3)
    const comics = await fetchUnlimitedManga('all', 3);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fffbf0] via-[#fff3e0] to-[#fffbf0] dark:from-[#0a0a0a] dark:via-[#1a110a] dark:to-[#0a0a0a] text-[#1a1510] dark:text-[#fff0e0] transition-colors">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar user={session?.user ?? null} />

                <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] to-[#c2410c] dark:from-[#f97316] dark:to-[#ea580c] mb-4 drop-shadow-sm">
                            Unlimited Comics
                        </h1>
                        <p className="text-lg md:text-xl font-medium text-[#1a1510]/70 dark:text-[#fff0e0]/70 max-w-2xl mx-auto">
                            Dive into our massive collection of unlimited comics. Deep crawled to bring you the best reading experience.
                        </p>
                    </div>

                    {comics.length > 0 ? (
                        <div className="manga-grid">
                            {comics.map((manga) => (
                                <MangaCard key={manga.id} manga={manga} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="mb-4 text-5xl animate-bounce">🚀</div>
                            <p className="uppercase tracking-widest font-bold">Scanning the multiverse...</p>
                            <p className="text-sm mt-2">No comics found yet. Try refreshing.</p>
                        </div>
                    )}
                </main>

                <Footer />
            </div>
        </div>
    );
}
