import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DonghuaListClient from "../../components/DonghuaListClient";
import DonghuaAlphabetFilter from "../../components/DonghuaAlphabetFilter";
import { AuthUserSession } from "../../libs/auth-libs";
import { fetchDonghuaLibraryAction } from "../../actions/donghua-actions";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DonghuaListPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const session = await AuthUserSession();
    const letter = Array.isArray(searchParams?.letter) ? searchParams.letter[0] : searchParams?.letter;

    const initialData = await fetchDonghuaLibraryAction(letter, 1);

    // Bind the action to pass letter state to client
    const boundFetchMore = fetchDonghuaLibraryAction.bind(null, letter);

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif flex flex-col transition-colors duration-300 w-full overflow-x-hidden">
            <Navbar user={session?.user ?? null} />

            <main className="mx-auto flex-1 w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10 flex">
                <header className="flex flex-col items-center justify-center py-16 text-center animate-fade-in relative">
                    <div className="mb-4 h-16 w-[1px] bg-[#8a857e]" />
                    <h1 className="text-4xl md:text-5xl font-medium tracking-[0.15em] text-[#2c2a27] dark:text-[#e0dbd3]" style={{ fontFamily: 'Georgia, serif' }}>
                        THE ARCHIVES
                    </h1>
                    <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#5c5852] dark:text-[#a09c95]">
                        The collection of ongoing and completed journeys. Scroll through the deep library.
                    </p>
                    <div className="mt-8 h-8 w-[1px] bg-[#e5dcd3] dark:bg-[#3a3836]" />
                </header>

                <div className="mb-10 flex flex-col gap-6">
                    <DonghuaAlphabetFilter />

                    <div className="flex items-center justify-between border-b border-[#e5dcd3] dark:border-[#3a3836] pb-4">
                        <h2 className="font-serif text-2xl uppercase text-[#1a1510] dark:text-[#dbd7d2] flex items-center gap-2 tracking-widest">
                            <span className="text-[#8a857e]">#</span> {letter ? `Index ${letter}` : "Semua Donghua"}
                        </h2>
                        <span className="text-xs font-bold tracking-widest text-[#8a857e]">
                            {initialData.items.length}{initialData.hasNext ? "+" : ""} JUDUL
                        </span>
                    </div>

                    <DonghuaListClient
                        initialLetter={letter}
                        initialPage={1}
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
