type FooterProps = {
  variant?: "default" | "comic";
};

export default function Footer({ variant = "default" }: FooterProps) {
  const isComic = variant === "comic";

  return (
    <footer
      className={`mt-auto w-full text-center tracking-[0.2em] transition-all
      ${isComic
          ? "border-t-[3px] border-[var(--manga-border)] bg-[var(--manga-bg)] py-12 text-[var(--manga-fg)] font-black uppercase"
          : "border-t border-zinc-200/60 py-10 text-xs text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400"
        }`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`font-brand ${isComic ? "text-2xl tracking-widest text-[var(--manga-accent)]" : "text-base text-zinc-900 dark:text-zinc-100"}`}>
          Animix
        </span>
        <span className={isComic ? "text-sm font-bold" : ""}>
          Dibuat sama <span className={`font-bold ${isComic ? "text-[var(--manga-accent)]" : "text-zinc-900 dark:text-zinc-100"}`}>Wizzy</span>
        </span>
      </div>
    </footer>
  );
}
