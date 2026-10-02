# <div align="center">黒 KURO SHELF</div>

<div align="center">

**Next-Generation Anime & Manga Discovery, Tracking, and Community Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Live Demo](https://ais-dev-aixftbwkp2qeg7fembqzix-282625357779.asia-east1.run.app) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Features](#features) • [License](#license)

</div>

---

## 📖 Overview

**Kuro Shelf** is a modern, high-performance web application designed for anime enthusiasts, manga readers, and collectors. Combining the richness of the **Jikan REST API (v4)** for anime and the **AniList GraphQL API** for manga, manhwa, manhua, and light novels, Kuro Shelf delivers a unified, executive-grade browsing and tracking experience.

Engineered with mobile-first responsiveness, executive obsidian aesthetics, and full cloud synchronization via **Supabase PostgreSQL & Auth**, Kuro Shelf bridges discovery, social engagement, and personal archiving into a single intuitive interface.

---

## ✨ Features

### ⛩️ Dual-Portal Architecture
- **Anime Portal**: Explore thousands of airing and classic series powered by Jikan v4, featuring episode counts, studios, voice actors, characters, broadcast times, and official trailers.
- **Library Portal**: Search and browse Manga, Manhwa, Manhua, and Light Novels using the AniList GraphQL engine, with chapter/volume counters and status indicators.
- **1-Tap Teleporter**: Instant context switching between Anime and Library portals across the entire platform.

### 📱 Mobile-First Experience
- **5-Tab Navigation**: Custom bottom bar (`Discover`, `This Season`, `Catalog`, `Rankings`, `More`).
- **Hardware-Accelerated Drawer**: Minimalist "More" menu with GPU-accelerated cubic-bezier slide-up and slide-down transitions.
- **Header Pop-Up Search**: Floating search panel that drops down smoothly below the branding bar without cluttering screen real estate.
- **Safe-Area Inset Support**: Designed for modern mobile displays (iOS notch, dynamic island, Android navigation bars).

### 📚 Kuro Shelf & Watchlist Tracking
- **Unified Status Management**: Categorize items into *Watching / Reading*, *Completed*, *On Hold*, *Dropped*, and *Plan to Watch*.
- **Progress Tracking**: Real-time episode and chapter increments with quick +/- counters.
- **Score Ratings & Favorites**: Personal 10-point rating scale and favorites curation.
- **Monthly Watchlist Drop**: Exclusive monthly recommendation drop unlocking on the 1st of every month for users with at least 10 saved titles.
- **Library Backup**: JSON import and export for effortless migration and offline backups.

### 🏆 Curated Discovery & Rankings
- **Seasonal Lineups**: Track current and upcoming seasonal broadcasting schedules.
- **Weekly Episode Timetables**: Categorized day-by-day release schedules.
- **Hall of Fame Rankings**: Filter by Top Rated, Most Popular, Trending, and Most Favorited.
- **Character & Voice Actor Explorer**: Discover cast rosters, Japanese/English voice talent, and character bios.

### 🗳️ Community & Gamification
- **Community Predictions & Polls**: Weekly matchups and user voting with real-time percentage breakdowns.
- **Daily Check-In Streaks**: Track attendance and consecutive daily streaks with milestone rewards.
- **Multi-Account Switcher**: Seamlessly switch between multiple accounts on shared devices.
- **Day / Night Obsidian Themes**: High-contrast dark obsidian theme and clean light theme with system preference detection.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Functional components, hooks, custom state management |
| **Language** | TypeScript 5.7 | End-to-end strict typing for API schemas and state models |
| **Styling** | Tailwind CSS v4 | Cutting-edge utility-first styling with custom keyframe physics |
| **Build Tool** | Vite 6 | Lightning-fast HMR and optimized production bundling |
| **Backend & Server** | Node.js + Express 5 | Middleware proxy, background ingestion workers, and API routing |
| **Database & Auth** | Supabase (PostgreSQL) | JWT authentication, Row Level Security (RLS), and cloud persistence |
| **External APIs** | Jikan v4 & AniList GraphQL | REST + GraphQL hybrid data pipeline with multi-tiered caching |
| **Icons & Motion** | Lucide React | Consistent, lightweight vector iconography |

---

## 🏗️ Project Architecture

```
kuroshelf/
├── api/                    # Serverless endpoints and proxy handlers
├── data/                   # Default datasets, fallbacks, and seed files
├── docs/                   # Extended documentation and architecture specs
├── public/                 # Static assets, logos, and favicon
├── server.ts               # Express 5 server & automated ingestion engine
├── src/
│   ├── components/         # Reusable React UI components
│   │   ├── AnimeCard.tsx           # Responsive anime media cards
│   │   ├── AnimeDetailModal.tsx    # Comprehensive media details modal
│   │   ├── AnimeFullPage.tsx       # Dedicated full-page series view
│   │   ├── BookDetailModal.tsx     # Manga & novel detail modal
│   │   ├── BooksPortalView.tsx     # Library portal (AniList engine)
│   │   ├── MobileBottomNav.tsx     # Mobile bottom bar & animated drawer
│   │   ├── Navbar.tsx              # Sticky branding bar & pop-up search
│   │   ├── PollsView.tsx           # Prediction polls & community voting
│   │   ├── ProfileView.tsx         # User profile & library statistics
│   │   ├── ScheduleView.tsx        # Weekly broadcast release timetable
│   │   └── ShelfView.tsx           # Personal watchlists & 10-anime drop
│   ├── config/             # Application constants and configuration
│   ├── lib/                # Supabase client and external client wrappers
│   ├── services/           # Data services, caching, API drivers
│   │   ├── anilistService.ts       # AniList GraphQL query client
│   │   ├── jikan.ts                # Jikan v4 REST client with rate limiting
│   │   ├── shelfStorage.ts         # Shelf persistence & backup service
│   │   ├── streakService.ts        # Daily check-in streak logic
│   │   └── themeService.ts         # Day/Night theme controller
│   ├── types.ts            # Core TypeScript models, schemas, and interfaces
│   ├── utils/              # Helper utilities (formatting, rankings, URLs)
│   ├── index.css           # Global stylesheet & GPU keyframe animations
│   ├── main.tsx            # React application entry point
│   └── App.tsx             # Root orchestration component
├── supabase/
│   └── migrations/         # PostgreSQL schema & Row Level Security policies
├── .env.example            # Environment variable template
├── .gitignore              # Production-grade git exclusions
├── LICENSE                 # MIT License
└── package.json            # Project manifest and build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm**, **pnpm**, or **yarn**
- *(Optional)* A free [Supabase](https://supabase.com) account for cloud database sync and user authentication.

### 1. Clone Repository
```bash
git clone https://github.com/your-username/kuroshelf.git
cd kuroshelf
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a local `.env` file from the provided template:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials (optional for offline guest browsing):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Build for Production
```bash
npm run build
```
This builds both the Vite frontend bundle and the Express server artifact into `dist/`.

---

## 🗄️ Database Setup (Supabase)

To enable user accounts, cloud shelf syncing, and community prediction polls:

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migration script located at `supabase/migrations/0000_init.sql`.
4. Enable **Email** and/or **Google OAuth** in **Authentication > Providers**.
5. Copy your **Project URL** and **anon key** into `.env`.

---

## ⚡ Performance & Caching

External API stability is critical when interfacing with third-party community endpoints:
- **Rate-Limit Dampening**: Automatic request debouncing and queue throttling to stay within Jikan (3 req/sec) and AniList rate limits.
- **Two-Tier Cache**: Memory cache for instantaneous tab switches, backed by persistent `localStorage` for offline session recovery.
- **Lazy Loading**: High-efficiency responsive image loading with smooth skeleton placeholders.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/kuroshelf/issues) or read [`CONTRIBUTING.md`](CONTRIBUTING.md) to get started.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m "feat: add AmazingFeature"`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👏 Acknowledgments

- [Jikan API](https://jikan.moe/) – Unofficial MyAnimeList REST API.
- [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/) – Powerful GraphQL API for anime and manga.
- [Lucide Icons](https://lucide.dev/) – Beautiful and consistent iconography.
- [Supabase](https://supabase.com/) – The open-source Firebase alternative.
