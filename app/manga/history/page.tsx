import Navbar from "@/app/components/Navbar";
import { AuthUserSession } from "@/app/libs/auth-libs";
import MangaHistoryList from "@/app/components/MangaHistoryList";
import Footer from "@/app/components/Footer";

export default async function MangaHistoryPage() {
    const session = await AuthUserSession();

    return (
        <div className="manga-mode min-h-screen flex flex-col">
            <Navbar user={session?.user ?? null} />
            <main className="mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10 flex-1">
                <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#ea580c] dark:text-[#f97316]">
                        RIWAYAT
                    </p>
                    <h1 className="font-display text-4xl font-black uppercase text-[#1a1510] dark:text-[#fff0e0]">
                        RIWAYAT BACA
                    </h1>
                    <p className="text-sm text-[#1a1510]/70 dark:text-[#fff0e0]/70">
                        Lanjutkan bacaanmu.
                    </p>
                </div>
                <MangaHistoryList title="Terakhir Dibaca" limit={20} />
            </main>
            <Footer variant="comic" />
        </div>
    );
}
