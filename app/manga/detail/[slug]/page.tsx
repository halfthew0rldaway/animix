import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MangaCover from "@/app/components/MangaCover";
import { AuthUserSession } from "@/app/libs/auth-libs";
import { getMangaDetail, getMangaChapters } from "@/app/libs/manga-api";
import Link from "next/link";

type PageProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MangaDetailPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const search = await searchParams;
    const session = await AuthUserSession();

    const [manga, chapters] = await Promise.all([
        getMangaDetail(slug),
        getMangaChapters(slug),
    ]);

    if (!manga) {
        notFound();
    }

    // Use cover from query params (from card) if available, as it works
    const coverFromCard = typeof search.cover === 'string' ? decodeURIComponent(search.cover) : null;
    const coverUrl = coverFromCard || manga.cover;

    return (
        <div className="manga-mode min-h-screen flex flex-col">
            <Navbar user={session?.user ?? null} />
            <main className="manga-detail-main flex-1 w-full">
                <div className="manga-detail-header">
                    <div className="manga-detail-cover-wrapper">
                        <MangaCover
                            src={coverUrl}
                            alt={manga.title}
                            className="manga-detail-cover"
                            priority
                        />
                        <div className="manga-detail-cover-shadow" />
                    </div>

                    <div className="manga-detail-info">
                        <h1 className="manga-detail-title">{manga.title}</h1>

                        <div className="manga-detail-meta">
                            {manga.author && (
                                <div className="manga-detail-meta-item">
                                    <span className="manga-detail-meta-label">Penulis:</span>
                                    <span className="manga-detail-meta-value">{manga.author}</span>
                                </div>
                            )}
                            {manga.type && (
                                <div className="manga-detail-meta-item">
                                    <span className="manga-detail-meta-label">Tipe:</span>
                                    <span className="manga-detail-meta-value">{manga.type}</span>
                                </div>
                            )}
                            {manga.status && (
                                <div className="manga-detail-meta-item">
                                    <span className="manga-detail-meta-label">Status:</span>
                                    <span className="manga-detail-meta-value">{manga.status}</span>
                                </div>
                            )}
                            {manga.rating && (
                                <div className="manga-detail-meta-item">
                                    <span className="manga-detail-meta-label">Penilaian:</span>
                                    <span className="manga-detail-meta-value">{manga.rating}</span>
                                </div>
                            )}
                        </div>

                        {manga.genres && manga.genres.length > 0 && (
                            <div className="manga-detail-tags">
                                {manga.genres.map((genre: any, index: number) => (
                                    <span key={index} className="manga-detail-tag">
                                        {typeof genre === 'string' ? genre : genre.name || genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {manga.description && (
                            <p className="manga-detail-description">{manga.description}</p>
                        )}
                    </div>
                </div>

                <div className="manga-chapters-section">
                    <h2 className="manga-chapters-title">
                        <span>Daftar Bab</span>
                        <div className="manga-chapters-title-accent" />
                    </h2>

                    {chapters.length > 0 ? (
                        <div className="manga-chapters-list">
                            {chapters.map((chapter) => (
                                <Link
                                    key={chapter.id}
                                    href={`/manga/read/${chapter.slug}?mangaSlug=${slug}&title=${encodeURIComponent(manga.title)}&cover=${encodeURIComponent(manga.cover)}`}
                                    className="manga-chapter-item"
                                >
                                    <div className="manga-chapter-number">
                                        Bab {chapter.chapter}
                                    </div>
                                    <div className="manga-chapter-info">
                                        <div className="manga-chapter-title">{chapter.title}</div>
                                        {chapter.releaseDate && (
                                            <div className="manga-chapter-meta">
                                                <span>{chapter.releaseDate}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="manga-chapter-arrow"><i className="fa-solid fa-arrow-right"></i></div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="manga-chapters-empty">
                            <p>Tidak ada bab tersedia</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer variant="comic" />
        </div>
    );
}
