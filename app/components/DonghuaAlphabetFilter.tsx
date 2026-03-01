"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const letters = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function DonghuaAlphabetFilter() {
    const searchParams = useSearchParams();
    const currentLetter = searchParams.get("letter");

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 justify-start sm:justify-center no-scrollbar py-6">
            {letters.map((letter) => {
                const isActive = currentLetter === letter;
                return (
                    <Link
                        key={letter}
                        href={isActive ? "/donghua/list" : `/donghua/list?letter=${letter}`}
                        scroll={false}
                        className={`
                            min-w-[32px] flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200
                            ${isActive
                                ? "bg-[#2c2a27] text-[#dbd7d2] shadow-md dark:bg-[#e0dbd3] dark:text-[#1c1b1a] scale-105"
                                : "text-[#8a857e] hover:text-[#5c5852] hover:bg-[#e5dcd3] dark:text-[#a09c95] dark:hover:bg-[#3a3836] dark:hover:text-[#dbd7d2]"
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
