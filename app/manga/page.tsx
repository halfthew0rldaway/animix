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
        <div className="manga-mode min-h-screen flex flex-col">
            <Navbar user={session?.user ?? null} />
            <main className="manga-main flex-1 w-full">
                <div className="manga-hero">
                    <div className="manga-hero-content">
                        <h1 className="manga-hero-title">
                            <span className="manga-hero-title-main">Comic</span>
                            <span className="manga-hero-title-sub">Collection</span>
                        </h1>
                        <p className="manga-hero-caption">
                            Baca ribuan judul komik favoritmu kapan saja.
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
                        title="KOMIK POPULER"
                        caption="Judul paling banyak diikuti saat ini"
                        initialMangas={popular}
                        initialPage={2}
                        fetchUrl="/api/manga-feed?type=popular"
                        warning={popular.length === 0 ? "Gagal memuat komik populer" : null}
                    />

                    <MangaSectionInfinite
                        title="UPDATE TERBARU"
                        caption="Chapter yang baru saja rilis"
                        initialMangas={latest}
                        initialPage={2}
                        fetchUrl="/api/manga-feed?type=latest"
                        warning={latest.length === 0 ? "Gagal memuat komik terbaru" : null}
                    />
                </div>
            </main>
            <Footer variant="comic" />
        </div>
    );
}
