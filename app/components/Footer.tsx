export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200/60 py-10 text-center text-xs uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400">
      <div className="flex flex-col items-center gap-2">
        <span className="font-brand text-base text-zinc-900 dark:text-zinc-100">
          Animix
        </span>
        <span>
          Crafted by <span className="text-zinc-900 dark:text-zinc-100">Wizzy</span>
        </span>
      </div>
    </footer>
  );
}
