# Manga API Issue - SSL Certificate Expired

## Problem

The Sankavollerei API (`https://api.sankavollerei.com`) has an **expired SSL certificate**:
- Certificate expired: **2025-12-29**
- Current date: **2026-02-08**

This causes all manga API requests to fail with SSL/TLS errors, which is why you're seeing "Unable to load popular manga" and "Unable to load latest manga" messages.

## Solution Options

### Option 1: Wait for Sankavollerei to Renew Certificate (Recommended if temporary)
The API maintainers need to renew their SSL certificate. This is their issue to fix.

### Option 2: Use Custom Manga API (Immediate Solution)
I've updated the code to support a custom manga API via environment variable.

**Add to your `.env` file:**
```env
NEXT_PUBLIC_MANGA_API_URL=https://your-alternative-manga-api.com
```

### Option 3: Use HTTP Instead (Not Recommended - Security Risk)
You could try using `http://` instead of `https://`, but this is insecure and may not work.

### Option 4: Use Alternative Manga API

Here are some alternative manga APIs you can use:

#### 1. **Consumet Manga Extension**
```env
NEXT_PUBLIC_MANGA_API_URL=https://api.consumet.org/manga/mangadex
```
- Free, no auth required
- Good documentation
- Active maintenance

#### 2. **Jikan (MyAnimeList)**
```env
# Note: Jikan is primarily for anime, limited manga support
NEXT_PUBLIC_MANGA_API_URL=https://api.jikan.moe/v4/manga
```

#### 3. **Self-Hosted Sankavollerei**
If you have the Sankavollerei source code, you can host it yourself with a valid SSL certificate.

## Current Implementation

The manga API now checks for `NEXT_PUBLIC_MANGA_API_URL` environment variable:

```typescript
const MANGA_API_BASE = process.env.NEXT_PUBLIC_MANGA_API_URL || "https://api.sankavollerei.com/comic";
```

**Default**: Sankavollerei (currently broken due to SSL)
**Fallback**: Any URL you specify in `.env`

## Testing the Fix

1. **Check if Sankavollerei is back online:**
   ```bash
   curl https://api.sankavollerei.com/comic/populer
   ```
   
   If you get SSL errors, it's still down.

2. **Use alternative API:**
   Add to `.env`:
   ```env
   NEXT_PUBLIC_MANGA_API_URL=https://api.consumet.org/manga/mangadex
   ```

3. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Check browser console:**
   Look for: `[Manga API] Using base URL: ...`

## Expected API Response Format

The manga API expects this response structure:

```json
{
  "data": [
    {
      "slug": "manga-slug",
      "title": "Manga Title",
      "thumbnail": "https://...",
      "synopsis": "Description",
      "status": "Ongoing",
      "type": "Manga",
      "rating": "8.5",
      "author": "Author Name",
      "genres": ["Action", "Adventure"]
    }
  ]
}
```

## Debugging

Check the browser console for these logs:
- `[Manga API] Using base URL: ...` - Shows which API is being used
- `[Manga API] Popular response: ...` - Shows API response status
- `[Manga API] Popular fetch failed: ...` - Shows error details

## Temporary Workaround

If you just want to test the manga UI without a working API:

1. The app will show "Unable to load" messages
2. The UI/UX is still visible and functional
3. Once a working API is configured, data will load automatically

## Recommendation

**For now**: The manga section will show empty states until either:
1. Sankavollerei renews their SSL certificate, OR
2. You configure an alternative manga API in `.env`

The anime section is unaffected and should work normally.

---

**Status**: ⚠️ Sankavollerei API SSL certificate expired
**Impact**: Manga section not loading data
**Workaround**: Configure alternative API via `NEXT_PUBLIC_MANGA_API_URL`
