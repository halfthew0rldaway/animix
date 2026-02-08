"use server";

import { fetchMangaLibrary, searchManga, MangaItem } from "@/app/libs/manga-api";

export async function fetchMangaLibraryAction(letter: string | undefined, page: number): Promise<{ items: MangaItem[], hasNext: boolean }> {
    // Use the robust unlimited-based fetch with native letter filtering
    return await fetchMangaLibrary(page, 50, letter);
}
