# Manga API Setup Guide

## Quick Setup

The manga API URL is configured via environment variable in your `.env` file.

### Step 1: Add to .env

Add this line to your `.env` file:

```env
NEXT_PUBLIC_MANGA_API_URL=https://api.sankavollerei.com/comic
```

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Current Issue: SSL Certificate

The Sankavollerei API has an **expired SSL certificate** (expired Dec 29, 2025). This causes the "fetch failed" error you're seeing.

**Error in console:**
```
[Manga API] Popular fetch failed: fetch failed
[Manga API] Latest fetch failed: fetch failed
```

## Solutions

### Option 1: Try HTTP Instead (Quick Test)

⚠️ **Not recommended for production** - insecure connection

```env
NEXT_PUBLIC_MANGA_API_URL=http://api.sankavollerei.com/comic
```

### Option 2: Use Proxy/CORS Bypass

If you have a backend proxy that can bypass SSL verification:

```env
NEXT_PUBLIC_MANGA_API_URL=https://your-proxy.com/api/comic
```

### Option 3: Wait for Certificate Renewal

Contact the API maintainer:
- **Telegram**: @OnlySankaaa
- **Website**: sankavollerei.com/about

### Option 4: Use Alternative Endpoints

Based on the API docs you provided, try these alternative base URLs:

```env
# Try different source endpoints
NEXT_PUBLIC_MANGA_API_URL=https://api.sankavollerei.com/comic/bacakomik
# or
NEXT_PUBLIC_MANGA_API_URL=https://api.sankavollerei.com/comic/komikstation
# or
NEXT_PUBLIC_MANGA_API_URL=https://api.sankavollerei.com/comic/mangakita
```

## Available Sankavollerei Endpoints

Based on the documentation, these sources are available:

### Main Comic Endpoints
- `/comic/populer` - Popular comics ✅
- `/comic/terbaru` - Latest comics ✅
- `/comic/search?q=query` - Search ✅
- `/comic/comic/:slug` - Detail ✅
- `/comic/chapter/:slug` - Read chapter ✅

### Alternative Sources
1. **BacaKomik** - `/comic/bacakomik/*`
2. **Komikstation** - `/comic/komikstation/*`
3. **Maid Comic** - `/comic/maid/*`
4. **Komikindo** - `/comic/komikindo/*`
5. **Mangakita** - `/comic/mangakita/*`
6. **SoulScans** - `/comic/soulscan/*`
7. **Bacaman** - `/comic/bacaman/*`
8. **Softkomik** - `/comic/softkomik/*`
9. **Westmanga** - `/comic/westmanga/*`
10. **Komikcast** - `/comic/komikcast/*`
11. **Mangasusuku** - `/comic/mangasusuku/*`

## Testing the API

### Check if API is accessible:

```bash
# Test with curl (may fail due to SSL)
curl https://api.sankavollerei.com/comic/populer

# Test with curl ignoring SSL (for testing only)
curl -k https://api.sankavollerei.com/comic/populer
```

### Check browser console:

Look for these logs:
```
[Manga API] Using base URL: https://api.sankavollerei.com/comic
[Manga API] Popular response: { ok: false, hasData: false, dataKeys: [], error: 'fetch failed' }
```

## Rate Limiting

The API has a **70 requests/minute** limit with 3 warnings before permanent ban.

**Important:**
- Don't spam the API
- Use the built-in rate limiting (already configured)
- Development cache is enabled (5 min TTL)

## Troubleshooting

### Error: "fetch failed"
**Cause**: SSL certificate expired
**Solution**: Try HTTP or wait for certificate renewal

### Error: "Unable to load popular manga"
**Cause**: API not responding or SSL issue
**Solution**: Check `.env` configuration and restart server

### No manga data showing
**Cause**: API URL not configured or wrong
**Solution**: Verify `NEXT_PUBLIC_MANGA_API_URL` in `.env`

## Environment Variables

Required in `.env`:

```env
# Manga API base URL (include /comic path)
NEXT_PUBLIC_MANGA_API_URL=https://api.sankavollerei.com/comic
```

Optional:

```env
# Rate limiting (shared with anime API)
API_RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_PER_MIN=70

# Development cache
DEV_API_CACHE=true
DEV_API_CACHE_TTL_MS=300000
```

## Contact API Provider

If you need:
- Whitelist from rate limit
- Unban (free)
- Report SSL certificate issue

**Contact:**
- Telegram: @OnlySankaaa
- Website: sankavollerei.com/about

## Next Steps

1. **Add `NEXT_PUBLIC_MANGA_API_URL` to your `.env` file**
2. **Restart your dev server**
3. **Check browser console for logs**
4. **If still failing, contact API provider about SSL certificate**

The manga UI is fully functional - it just needs a working API endpoint!
