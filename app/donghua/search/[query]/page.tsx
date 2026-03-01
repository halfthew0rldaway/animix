import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import DonghuaListClient from "../../../components/DonghuaListClient";
import { AuthUserSession } from "../../../libs/auth-libs";
import { fetchDonghuaSearchAction } from "../../../actions/donghua-search-actions";

export const dynamic = "force-dynamic";

interface SearchPageProps {
    params: Promise<{ query: string }>;
}

export default async function DonghuaSearchPage({ params }: SearchPageProps) {
    const { query } = await params;
    const decodedQuery = decodeURIComponent(query);
    const session = await AuthUserSession();

    const initialData = await fetchDonghuaSearchAction(decodedQuery, 1);
    const boundFetchMore = fetchDonghuaSearchAction.bind(null, decodedQuery);

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif flex flex-col transition-colors duration-300 w-full overflow-x-hidden">
            <Navbar user={session?.user ?? null} />

            <main className="mx-auto flex-1 w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10 flex">
                <header className="flex flex-col items-center justify-center py-16 text-center animate-fade-in relative">
                    <div className="mb-4 h-16 w-[1px] bg-[#8a857e]" />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a857e] mb-2 font-bold">
                        HASIL PENCARIAN DONGHUA
                    </p>
                    <h1
                        className="text-3xl md:text-5xl font-medium tracking-[0.15em] text-[#2c2a27] dark:text-[#e0dbd3]"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        "{decodedQuery}"
                    </h1>
                    <div className="mt-8 h-8 w-[1px] bg-[#e5dcd3] dark:bg-[#3a3836]" />
                </header>

                <div className="mb-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-[#e5dcd3] dark:border-[#3a3836] pb-4">
                        <h2 className="font-serif text-2xl uppercase text-[#1a1510] dark:text-[#dbd7d2] flex items-center gap-2 tracking-widest">
                            <span className="text-[#8a857e]">#</span> ARSIP
                        </h2>
                        <span className="text-xs font-bold tracking-widest text-[#8a857e]">
                            DITEMUKAN
                        </span>
                    </div>

                    <DonghuaListClient
                        initialItems={initialData.items}
                        fetchMoreAction={boundFetchMore}
                        hasNextPage={initialData.hasNext}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
