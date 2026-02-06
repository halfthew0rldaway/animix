import Navbar from "../../components/Navbar";
import { AuthUserSession } from "../../libs/auth-libs";
import { buildApiUrl, safeFetchJson } from "../../libs/api";

type DownloadUrl = {
  url: string;
  name?: string;
};

type Quality = {
  quality?: string;
  urls?: DownloadUrl[];
};

type Format = {
  name?: string;
  qualities?: Quality[];
};

type BatchData = {
  title?: string;
  downloadUrl?: {
    formats?: Format[];
  };
};

type BatchResponse = {
  data?: BatchData;
  result?: { data?: BatchData };
};

const extractData = (payload: BatchResponse): BatchData | null => {
  if (payload.data) return payload.data;
  if (payload.result?.data) return payload.result.data;
  return null;
};

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await AuthUserSession();
  const { slug } = await params;

  let data: BatchData | null = null;
  let error: string | null = null;

  try {
    const res = await safeFetchJson<BatchResponse>(
      buildApiUrl(`/batch/${encodeURIComponent(slug)}`),
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      data = extractData(res.data);
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load batch";
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            Batch Download
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Download Batch
          </h1>
          {data?.title ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {data.title}
            </p>
          ) : null}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            For offline watching.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-rose-500">
              Downloads are unavailable right now.
            </p>
          ) : null}
        </div>

        {data?.downloadUrl?.formats?.length ? (
          <div className="flex flex-col gap-6">
            {data.downloadUrl.formats.map((format, index) => (
              <div
                key={`${format.name ?? "format"}-${index}`}
                className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-900 dark:text-white">
                  {format.name ?? "Format"}
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {format.qualities?.map((quality, qualityIndex) => (
                    <div
                      key={`${quality.quality ?? "quality"}-${qualityIndex}`}
                      className="rounded-2xl border border-dashed border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-200">
                        {quality.quality ?? "Quality"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quality.urls?.map((url, urlIndex) => (
                          <a
                            key={`${url.url}-${urlIndex}`}
                            href={url.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-zinc-200 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-600 transition hover:-translate-y-[1px] hover:border-zinc-400 active:translate-y-0 dark:border-zinc-800 dark:text-zinc-300"
                          >
                            {url.name ?? "Download"}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Tidak ada link download tersedia.
          </div>
        )}
      </main>
    </div>
  );
}
