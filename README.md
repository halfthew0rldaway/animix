# Animix - Anime & Manga Platform

A modern Next.js application for streaming anime and reading manga with a unique dual-mode interface.

## 🎨 Features

### Anime Mode (Watch)
- Browse ongoing and completed anime
- Stream episodes with multiple server options
- Search anime titles
- Watch history tracking
- Responsive anime cards with hover effects

### Manga Mode (Read)
- Browse popular and latest manga
- Read manga chapters with smooth page navigation
- Comic-driven UI design with bold outlines and shadows
- Keyboard navigation support (Arrow keys)
- Search manga titles
- Responsive manga cards with comic-style aesthetics

### Dual-Mode Interface
- Seamless toggle between Anime and Manga modes
- Smooth page-flip transition animation
- Separate UI aesthetics for each mode
- Context-aware search (searches anime or manga based on current mode)

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Custom CSS
- **Authentication**: NextAuth.js
- **Database**: Prisma (optional)
- **APIs**: 
  - Consumet API (Anime)
  - Sankavollerei API (Manga) - Indonesian comprehensive comic API
  - AniList GraphQL API (Metadata)

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## 🔧 Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=your_anime_api_url

# Manga API (Optional - defaults to Sankavollerei)
NEXT_PUBLIC_MANGA_API_URL=https://www.sankavollerei.com/comic

# Authentication
NEXT_AUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Database (Optional)
USE_DATABASE=false
NEXT_PUBLIC_USE_DATABASE=false
DATABASE_URL=postgresql://user:pass@host:port/db

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret

# Rate Limiting (Optional)
API_RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_PER_MIN=70
```

**Note**: See `.env.example` for a complete template.

## 📁 Project Structure

```
app/
├── components/
│   ├── AnimeCard.tsx          # Anime card component
│   ├── AnimeSection.tsx       # Anime section layout
│   ├── MangaCard.tsx          # Manga card with comic style
│   ├── MangaSection.tsx       # Manga section layout
│   ├── ModeToggle.tsx         # Anime/Manga mode switcher
│   ├── Navbar.tsx             # Navigation bar
│   └── ...
├── libs/
│   ├── api.ts                 # Anime API utilities
│   ├── manga-api.ts           # Manga API utilities
│   ├── anilist.ts             # AniList integration
│   └── auth-libs.ts           # Authentication helpers
├── manga/
│   ├── page.tsx               # Manga home page
│   ├── detail/[id]/           # Manga detail page
│   ├── read/[id]/             # Manga reader
│   └── search/[query]/        # Manga search results
├── watch/[episodeSlug]/       # Anime player
├── detail/[slug]/             # Anime details
├── search/[slug]/             # Anime search
└── page.tsx                   # Anime home page
```

## 🎨 Design Philosophy

### Anime Mode
- Clean, modern interface
- Smooth animations and transitions
- Focus on visual hierarchy
- Card-based layout with hover effects

### Manga Mode (Comic-Driven)
- **Bold Borders**: 3-4px solid borders on all elements
- **Drop Shadows**: Offset shadows for depth (8px offset)
- **Accent Colors**: Orange/red accent (#ff6b35) for CTAs
- **Typography**: Uppercase display font for titles
- **Skewed Elements**: Slight rotation/skew for dynamic feel
- **Halftone Patterns**: Decorative patterns in hero section
- **Speech Bubble Effects**: Badge overlays on cards
- **No Glassmorphism**: Solid backgrounds only
- **No Gradients**: Flat colors with patterns

## 🎯 Key Features

### Mode Toggle
- Located in navbar next to brand logo
- Smooth slider animation
- Icons + labels for clarity
- Persistent across navigation

### Page Transitions
- 3D page-flip effect when switching modes
- 300ms duration for smooth experience
- Maintains scroll position

### Manga Reader
- Full-screen reading experience
- Click to advance, arrow keys for navigation
- Page counter and progress indicator
- Back button to return to manga details
- Loading states for images

### Search
- Context-aware (anime vs manga)
- Real-time results
- Responsive grid layout
- Empty state handling

## 🔄 API Integration

### Anime API (Consumet)
- `/ongoing` - Get ongoing anime
- `/completed` - Get completed anime
- `/search/{query}` - Search anime
- `/detail/{slug}` - Get anime details
- `/episode/{slug}` - Get episode streams

### Manga API (Sankavollerei)
- `/comic/populer` - Get popular manga
- `/comic/terbaru` - Get latest manga
- `/comic/search?q={query}` - Search manga
- `/comic/comic/{slug}` - Get manga details
- `/comic/chapter/{slug}` - Get chapter pages

**Features:**
- 6,297+ comics with deep crawling
- Real-time data with parallel fetching
- 70 requests/minute rate limit
- Manga-only filtering (excludes manhwa/manhua)
- Integrated rate limiting with anime API

## 🎨 Custom Fonts

- **Display**: Cinzel (titles, headers)
- **Brand**: Sukajan Brush (logo)
- **Body**: Manrope (content)
- **Mono**: JetBrains Mono (code)
- **Typewriter**: Space Mono (special effects)

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Adaptive grid layouts
- Touch-friendly controls
- Optimized for all screen sizes

## 🚀 Performance

- Server-side rendering for initial load
- Static generation where possible
- Image lazy loading
- Revalidation strategies (300s-3600s)
- Optimized bundle size

## 🔐 Authentication

- NextAuth.js integration
- Google & GitHub OAuth
- Optional database storage
- JWT fallback mode
- Session management

## 📝 Best Practices

- Clean, maintainable code
- TypeScript for type safety
- Component reusability
- Separation of concerns
- Error handling
- Loading states
- Empty states

## 🛠️ Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🙏 Credits

- Anime data: Consumet API
- Manga data: Sankavollerei API (Indonesian comprehensive comic API)
- Metadata: AniList GraphQL API
- Icons: Emoji
- Fonts: Google Fonts

---

**Note**: This project is for educational purposes. Please respect the APIs' rate limits and terms of service.
