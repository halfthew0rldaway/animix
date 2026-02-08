import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MangaSection from "@/app/components/MangaSection";
import { AuthUserSession } from "@/app/libs/auth-libs";
import { searchManga } from "@/app/libs/manga-api";

type PageProps = {
    params: Promise<{ query: string }>;
};

export default async function MangaSearchPage({ params }: PageProps) {
    const { query } = await params;
    const session = await AuthUserSession();

    const decodedQuery = decodeURIComponent(query);
    const results = await searchManga(decodedQuery, 30);

    return (
        <div className="manga-mode min-h-screen">
            <Navbar user={session?.user ?? null} />
            <main className="manga-main">
                <div className="manga-search-header">
                    <h1 className="manga-search-title">
                        Search Results for: <span className="manga-search-query">{decodedQuery}</span>
                    </h1>
                    <p className="manga-search-count">
                        {results.length} {results.length === 1 ? 'result' : 'results'} found
                    </p>
                </div>

                <MangaSection
                    title="Results"
                    mangas={results}
                    warning={results.length === 0 ? `No manga found for "${decodedQuery}"` : null}
                />

                <Footer />
            </main>
        </div>
    );
}
