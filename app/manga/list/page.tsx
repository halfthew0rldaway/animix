import { fetchMangaLibraryAction } from "@/app/actions/manga-actions";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { AuthUserSession } from "@/app/libs/auth-libs";
import InfiniteScrollList from "@/app/components/InfiniteScrollList";
import AlphabetFilter from "@/app/components/AlphabetFilter";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ComicListPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const session = await AuthUserSession();
    const letter = Array.isArray(searchParams?.letter) ? searchParams.letter[0] : searchParams?.letter;

    // Fetch initial page. Note action args are swapped: (letter, page)
    const initialData = await fetchMangaLibraryAction(letter, 1);

    // Bind the action to pass letter state to client
    const boundFetchMore = fetchMangaLibraryAction.bind(null, letter);

    return (
        <div className="manga-mode min-h-screen flex flex-col">
            <Navbar user={session?.user ?? null} />
            <main className="manga-main flex-1 w-full">
                {/* Hero Section - Matching Home Page Style */}
                <div className="manga-hero">
                    <div className="manga-hero-content">
                        <h1 className="manga-hero-title">
                            <span className="manga-hero-title-main">Comic</span>
                            <span className="manga-hero-title-sub">Library</span>
                        </h1>
                        <p className="manga-hero-caption">
                            Jelajahi ribuan judul. Temukan favoritmu.
                        </p>
                    </div>
                    {/* Decoration consistent with home */}
                    <div className="manga-hero-decoration">
                        <div className="manga-hero-panel" />
                        <div className="manga-hero-panel" />
                        <div className="manga-hero-panel" />
                    </div>
                </div>

                <div className="manga-content">
                    {/* Filter & List */}
                    <div className="mb-10 flex flex-col gap-6">
                        <AlphabetFilter />

                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 pb-4">
                            <h2 className="font-display text-2xl font-bold uppercase text-[#1a1510] dark:text-[#fff0e0] flex items-center gap-2">
                                <span className="text-orange-600">#</span> {letter ? `Index ${letter}` : "Semua Komik"}
                            </h2>
                            <span className="text-xs font-bold tracking-widest text-[#1a1510]/50 dark:text-[#fff0e0]/50">
                                {initialData.items.length}{initialData.hasNext ? "+" : ""} JUDUL
                            </span>
                        </div>

                        {initialData.items.length > 0 ? (
                            <InfiniteScrollList
                                key={letter || "all"}
                                initialItems={initialData.items}
                                fetchMoreAction={boundFetchMore}
                                hasNextPage={initialData.hasNext}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-[#1a1510]/60 dark:text-[#fff0e0]/60">
                                <div className="mb-4 text-4xl">📚</div>
                                <p className="uppercase tracking-widest">Tidak ada komik ditemukan {letter ? `dengan awalan ${letter}` : ""}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer variant="comic" />
        </div>
    );
}
