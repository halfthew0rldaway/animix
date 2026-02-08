import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MangaSectionInfinite from "../components/MangaSectionInfinite";
import { AuthUserSession } from "../libs/auth-libs";
import { fetchPopularManga, fetchLatestManga } from "../libs/manga-api";

export default async function MangaPage() {
    const session = await AuthUserSession();

    const [popular, latest] = await Promise.all([
        fetchPopularManga(24),
        fetchLatestManga(24),
    ]);

    return (
        <div className="manga-mode min-h-screen">
            <Navbar user={session?.user ?? null} />
            <main className="manga-main">
                <div className="manga-hero">
                    <div className="manga-hero-content">
                        <h1 className="manga-hero-title">
                            <span className="manga-hero-title-main">Comic</span>
                            <span className="manga-hero-title-sub">Collection</span>
                        </h1>
                        <p className="manga-hero-caption">
                            Dive into thousands of comic titles. Read your favorites anytime.
                        </p>
                    </div>
                    <div className="manga-hero-decoration">
                        <div className="manga-hero-panel" />
                        <div className="manga-hero-panel" />
                        <div className="manga-hero-panel" />
                    </div>
                </div>

                <div className="manga-content">
                    <MangaSectionInfinite
                        title="Popular Comics"
                        caption="Most followed titles right now"
                        initialMangas={popular}
                        initialPage={2}
                        fetchUrl="/api/manga-feed?type=popular"
                        warning={popular.length === 0 ? "Unable to load popular comics" : null}
                    />

                    <MangaSectionInfinite
                        title="Latest Updates"
                        caption="Recently updated chapters"
                        initialMangas={latest}
                        initialPage={2}
                        fetchUrl="/api/manga-feed?type=latest"
                        warning={latest.length === 0 ? "Unable to load latest comics" : null}
                    />
                </div>

                <Footer />
            </main>
        </div>
    );
}
