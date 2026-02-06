import LoadingMascot from "./LoadingMascot";

type LoadingScreenProps = {
  title?: string;
  message?: string;
};

export default function LoadingScreen({
  title = "Loading",
  message,
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-4 px-6 py-12">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        <LoadingMascot message={message ?? "Summoning the list..."} />
      </div>
    </div>
  );
}
