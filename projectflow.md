# FROM Juju Otaku 2.0 - Project Flow and Integration Notes

Dokumen ini merangkum alur utama aplikasi, terutama Home Page, Streaming, dan API. Tujuannya supaya kamu bisa replikasi flow ke project Next.js lain dengan detail yang jelas.

## 1) Struktur Utama (App Router)

- Semua route ada di `src/app` (Next.js App Router).
- Server Component dipakai untuk page yang fetch data dari API (contoh: Home, Detail, Search, Download).
- Client Component dipakai untuk state interaktif (contoh: Watch, HistoryList, AnimeListClient, Navbar).
- Provider NextAuth dibungkus di `src/app/layout.jsx` melalui `src/app/components/NextAuthProvider.jsx`.

## 2) Home Page Flow (src/app/page.jsx)

Ringkasan alur:

1. `Home` adalah Server Component `async`.
2. Ambil `NEXT_PUBLIC_API_URL` dari env.
3. Ambil session user via `AuthUserSession()` dari `src/app/libs/auth-libs.js`.
4. Lakukan fetch paralel ke endpoint anime:
   - `${API}/ongoing`
   - `${API}/completed`
5. Jika fetch gagal, tampilkan pesan warning per section.
6. Render komponen:
   - `Navbar` (menerima `user` agar link login/logout menyesuaikan).
   - `HeroSection` (UI hero).
   - `AnimeOngoing` dan `AnimeCompleted` (list card).

Data yang dipakai di card (dari API):
- `slug`, `title`, `poster`, `episode`, `type`, `release_day`.

## 3) Streaming / Watch Page Flow (src/app/watch/[episodeSlug]/page.jsx)

Ringkasan alur:

1. Page ini **Client Component** karena butuh state, session, localStorage, dan interaksi UI.
2. Mengambil `episodeSlug` dari params route `/watch/[episodeSlug]`.
3. Fetch episode detail ke `${API}/episode/{episodeSlug}`.
4. Response dipakai untuk:
   - `episodeData.title` menjadi judul halaman.
   - `episodeData.streams` menjadi daftar server.
   - `streams[0].url` dipakai sebagai stream default.
5. Player menggunakan `iframe` yang source-nya adalah `stream.url`.
6. Navigasi prev/next episode:
   - Slug dihitung dari pattern `-episode-{n}`.
   - Cek keberadaan episode dengan `HEAD ${API}/episode/{slug}`.
7. Riwayat tonton (History) disimpan dengan dua mode:
   - Jika `NEXT_PUBLIC_USE_DATABASE=true` dan user login: POST ke `/api/history`.
   - Jika database nonaktif: simpan ke `localStorage` key `juju-otaku-history`.
8. Untuk menyimpan info anime di history, Watch Page mengambil data dari query params:
   - `slug`, `title`, `image`.
   - Jika tidak ada, fallback ke `sessionStorage`.

## 4) Detail Page Flow (src/app/detail/[slug]/page.jsx)

1. Server Component fetch detail ke `${API}/detail/{slug}`.
2. Response `detail` dipakai untuk:
   - Info anime (judul, poster, status, dll).
   - Daftar episode `detail.episodes`.
   - Link download batch jika ada `detail.batch.slug`.
3. Saat user klik episode atau tombol Watch Now, halaman detail menambahkan query params:
   - `slug`, `title`, `image`.
   Ini dipakai Watch Page untuk menyimpan history.

Field penting yang dipakai dari response `detail`:
- `title`, `poster`, `synopsis`, `duration`, `author`, `season`, `aired`, `studio`, `synonym`, `status`.
- `genres[]` dengan `slug` dan `name`.
- `episodes[]` dengan `slug` dan `name`.
- `batch.slug` (opsional untuk download).

## 5) Anime List A-Z (src/app/animelist/page.jsx + AnimeListClient)

1. Server Component fetch data awal `letter=A&page=1`.
2. Data awal dilempar ke `AnimeListClient` (Client Component).
3. `AnimeListClient` menangani:
   - Filter huruf A-Z.
   - Infinite scroll paging di client.
4. Endpoint yang dipakai: `${API}/animelist?letter={A-Z}&page={n}`.

Field penting: `result.animes` adalah array dengan `slug`, `title`, `poster`, `type`.

## 6) Search Flow (src/app/search/[slug]/page.jsx)

1. Server Component fetch ke `${API}/search/{slug}`.
2. Response dipakai untuk card search.

Field yang dipakai: `slug`, `type`, `title`, `poster`, `episode`.

## 7) Download Batch Flow (src/app/download/[slug]/page.jsx)

1. Server Component fetch ke `${API}/batch/{slug}`.
2. Response `data` dipakai untuk render list download.

Field penting yang dipakai:
- `data.title`.
- `data.downloadUrl.formats[].qualities[].urls[]`.

## 8) Internal API (Next.js API Routes)

### 8.1 NextAuth
- Route: `src/app/api/auth/[...nextauth]/route.js`
- Provider: Google dan GitHub.
- Adapter Prisma **aktif jika** `prisma` tersedia (lihat `USE_DATABASE`).
- Session strategy:
  - `database` jika DB aktif.
  - `jwt` jika DB nonaktif.

### 8.2 History API
- Route: `src/app/api/history/route.js`
- Method:
  - `POST` untuk simpan riwayat.
  - `DELETE` untuk hapus riwayat.
- Wajib session login jika DB aktif.
- Body `POST`:
  - `animeId`, `episodeId`, `title`, `image`.
- `DELETE` memakai query string `id` (history id di DB).

Catatan penting:
- Di file `src/app/api/history/route.js` ada pemanggilan `dbDisabledResponse()` tetapi fungsi ini **tidak didefinisikan** di repo. Ini akan error jika route dipanggil saat DB nonaktif. Perlu ditambahkan helper atau diganti dengan response standar.

## 9) Database (Prisma) Flow

- Prisma client di `src/app/libs/prisma.js` memakai `USE_DATABASE`.
- Jika `USE_DATABASE=true`, Prisma aktif.
- Jika `USE_DATABASE=false`, Prisma diset `null`.
- Schema ada di `prisma/schema.prisma` dengan model NextAuth standar + `WatchHistory`.

Flow riwayat:
- Watch Page melakukan POST ke `/api/history` bila DB aktif.
- History List melakukan DELETE ke `/api/history` bila DB aktif.
- Jika DB nonaktif, semua data disimpan di localStorage browser.

## 10) Environment Variables yang Perlu Dicopy

Minimal agar aplikasi jalan:
- `NEXT_PUBLIC_API_URL` (wajib untuk semua fetch API anime).

Untuk fitur Auth:
- `NEXT_AUTH_SECRET` (dipakai NextAuth).
- `NEXTAUTH_URL` (wajib di production, walau tidak dipakai langsung di code).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional jika pakai Google login).
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (optional jika pakai GitHub login).

Untuk fitur Database (Opsional):
- `USE_DATABASE=true|false` (server side).
- `NEXT_PUBLIC_USE_DATABASE=true|false` (client side).
- `DATABASE_URL` (wajib jika `USE_DATABASE=true`).

Contoh `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-anime-api

NEXT_AUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

USE_DATABASE=false
NEXT_PUBLIC_USE_DATABASE=false
DATABASE_URL=postgresql://user:pass@host:port/db

GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret
```

## 11) Ringkasan Endpoint API External yang Dipakai

1. `GET /ongoing` -> `animes[]` untuk Home.
2. `GET /completed` -> `animes[]` untuk Home.
3. `GET /search/{slug}` -> `animes[]` untuk Search.
4. `GET /detail/{slug}` -> `detail` untuk Detail page.
5. `GET /episode/{episodeSlug}` -> `title` dan `streams[]` untuk Watch page.
6. `HEAD /episode/{episodeSlug}` -> validasi prev/next episode.
7. `GET /animelist?letter={A-Z}&page={n}` -> `animes[]` untuk Anime List.
8. `GET /batch/{slug}` -> `data.downloadUrl` untuk Download page.

## 12) File Penting untuk Referensi Flow

- Home Page: `src/app/page.jsx`
- Watch/Streaming: `src/app/watch/[episodeSlug]/page.jsx`
- Detail: `src/app/detail/[slug]/page.jsx`
- Search: `src/app/search/[slug]/page.jsx`
- Anime List: `src/app/animelist/page.jsx`, `src/app/components/AnimeListClient.jsx`
- Download: `src/app/download/[slug]/page.jsx`
- NextAuth: `src/app/api/auth/[...nextauth]/route.js`
- History API: `src/app/api/history/route.js`
- Prisma client: `src/app/libs/prisma.js`
- Prisma schema: `prisma/schema.prisma`
- Layout & Provider: `src/app/layout.jsx`, `src/app/components/NextAuthProvider.jsx`

