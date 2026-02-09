"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const letters = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function AlphabetFilter() {
    const searchParams = useSearchParams();
    const currentLetter = searchParams.get("letter");

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 justify-start sm:justify-center no-scrollbar py-6">
            {letters.map((letter) => {
                const isActive = currentLetter === letter;
                return (
                    <Link
                        key={letter}
                        href={isActive ? "/manga/list" : `/manga/list?letter=${letter}`}
                        scroll={false}
                        className={`
                            min-w-[32px] flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200
                            ${isActive
                                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-105"
                                : "text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-orange-400"
                            }
                        `}
                        aria-label={`Filter by letter ${letter}`}
                    >
                        {letter}
                    </Link>
                );
            })}
        </div>
    );
}
