import type { MangaItem } from "../libs/manga-api";
import MangaCard from "./MangaCard";

type MangaSectionProps = {
    title: string;
    caption?: string;
    mangas: MangaItem[];
    warning?: string | null;
};

export default function MangaSection({
    title,
    caption,
    mangas,
    warning,
}: MangaSectionProps) {
    return (
        <section className="manga-section">
            <div className="manga-section-header">
                <div className="manga-section-title-wrapper">
                    <h2 className="manga-section-title">{title}</h2>
                    <div className="manga-section-accent" />
                </div>
                {caption && <p className="manga-section-caption">{caption}</p>}
            </div>

            {warning ? (
                <div className="manga-section-warning">
                    <p>{warning}</p>
                </div>
            ) : mangas.length > 0 ? (
                <div className="manga-grid">
                    {mangas.map((manga) => (
                        <MangaCard key={manga.id} manga={manga} />
                    ))}
                </div>
            ) : (
                <div className="manga-section-empty">
                    <p>No comics available</p>
                </div>
            )}
        </section>
    );
}
