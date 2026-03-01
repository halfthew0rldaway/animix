import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import HistoryList from "../../components/HistoryList";
import { AuthUserSession } from "../../libs/auth-libs";

export default async function DonghuaHistory() {
    const session = await AuthUserSession();

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif transition-colors duration-300 w-full overflow-x-hidden">
            <Navbar user={session?.user ?? null} />

            <main className="mx-auto flex-1 w-full flex-col gap-12 px-4 py-8 sm:px-6 lg:px-10 flex">
                <header className="flex flex-col items-center justify-center py-16 text-center animate-fade-in relative mt-8">
                    <div className="mb-4 h-16 w-[1px] bg-[#8a857e]" />
                    <h1 className="text-4xl md:text-5xl font-medium tracking-[0.15em] text-[#2c2a27] dark:text-[#e0dbd3]" style={{ fontFamily: 'Georgia, serif' }}>
                        RIWAYAT
                    </h1>
                    <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#5c5852] dark:text-[#a09c95]">
                        Jejak perjalanan budidaya dan petualangan Anda.
                    </p>
                    <div className="mt-8 h-8 w-[1px] bg-[#e5dcd3] dark:bg-[#3a3836]" />
                </header>

                <section className="bg-white/50 dark:bg-zinc-950/30 rounded-2xl p-6 sm:p-10 border border-[#e5dcd3] dark:border-[#3a3836]">
                    <HistoryList title="Donghua Terakhir Ditonton" limit={20} baseRoute="/donghua/watch" historyKey="animix-donghua-history" />
                </section>
            </main>
            <Footer />
        </div>
    );
}
