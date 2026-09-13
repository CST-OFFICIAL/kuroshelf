# Kuro Shelf — Product Specification

## 1. Product Overview

Kuro Shelf is an anime and manga discovery, tracking, and community platform.

The goal is to provide users with a modern place to:

- Discover anime and manga
- Search and browse titles
- See where anime can be watched
- Track upcoming releases
- Bookmark anime
- Like and rate anime
- Participate in prediction polls
- Discuss anime through Disqus
- Discover manga related to anime
- Find manga purchase links through Amazon affiliate links

Kuro Shelf should have original branding and UI rather than copying MyAnimeList, AniList, or another existing service.

---

## 2. Core Technology

Preferred stack:

- Next.js
- TypeScript
- React
- Tailwind CSS
- PostgreSQL
- Prisma or another suitable ORM
- Jikan API
- Disqus
- GitHub
- Authentication system
- Responsive design
- SEO-friendly architecture

Use current stable technologies where practical.

---

## 3. Anime Data

Jikan will be the primary external source for anime and manga information.

Kuro Shelf should support:

- Anime search
- Anime details
- Seasonal anime
- Upcoming anime
- Rankings
- Genres
- Recommendations
- Related anime
- Manga information
- Related manga

Important:

Do not invent Jikan endpoints or response fields.

Create a dedicated service layer for Jikan integration so the rest of the application does not depend directly on external API implementation details.

External API failures must be handled gracefully.

---

## 4. Main Pages

The application should eventually include:

### Public

- Home
- Anime
- Anime detail
- Seasonal anime
- Upcoming anime
- Rankings
- Genres
- Search
- Manga
- Manga detail
- Community
- Polls
- About
- Contact
- Privacy Policy
- Terms

### User

- Login
- Register
- Profile
- Bookmarks
- Ratings
- Likes
- Activity
- Settings

### Admin

- Admin dashboard
- Anime management
- Manga management
- Poll management
- Platform/watch-link management
- Affiliate product management
- Moderation
- Site settings

---

## 5. Anime Detail Page

Each anime page should eventually contain:

- Poster
- Title
- Alternative titles
- Synopsis
- Genres
- Score
- Rank
- Popularity
- Status
- Episode count
- Episode duration
- Broadcast information
- Season
- Year
- Studio
- Source material
- Bookmark button
- Like button
- Rating button
- Share functionality
- Where-to-watch information
- Release information
- Countdown timer
- Community rating
- Prediction poll
- Disqus comments
- Related anime
- Related manga

---

## 6. Where to Watch

Kuro Shelf should display legitimate platforms where an anime may be available.

Each watch entry may contain:

- Platform name
- URL
- Region
- Availability
- Last verified date
- Affiliate status where applicable

Do not invent availability.

The architecture should allow watch platforms to be updated independently from Jikan data.

---

## 7. User Features

Authenticated users should eventually be able to:

### Bookmarks

Save anime and manga to a personal library.

### Likes

Like anime.

### Ratings

Rate anime using a 1–10 rating system.

### Activity

Show relevant user activity.

### Profile

Display basic public profile information and library/activity where appropriate.

---

## 8. Prediction Polls

Kuro Shelf should include fun prediction polls.

Examples:

- Who will win?
- What will happen next?
- Which character will return?
- What will the next episode reveal?

Polls should support:

- Question
- Multiple options
- Start time
- End time
- Active/upcoming/closed state
- Vote counts
- One vote per authenticated user where appropriate

Users should not be able to manipulate vote counts.

---

## 9. Release Countdown

Anime release countdowns should use reliable timestamps.

Requirements:

- Use UTC internally.
- Convert display time to the user's local timezone.
- Show countdown for upcoming releases.
- Clearly indicate when a countdown is unavailable.
- Avoid fake or estimated release times unless explicitly labeled as estimates.

---

## 10. Comments

Use Disqus for anime discussions.

Requirements:

- Stable discussion identifier for each anime.
- Lazy-load Disqus where practical.
- Keep Disqus configuration centralized.
- Do not build a custom comment system unless specifically required later.

---

## 11. Manga and Amazon Affiliate System

Kuro Shelf should display manga related to anime.

Where appropriate, users can be directed to Amazon through affiliate links.

The affiliate architecture should be provider-independent.

Potential data:

- Manga title
- ISBN
- Product title
- Amazon URL
- Affiliate URL
- Region
- Price when available
- Last verified date

Never fabricate product availability or prices.

Affiliate links should be clearly disclosed where legally required.

---

## 12. Advertising

Kuro Shelf may use advertising for monetization.

Ads should use reusable components such as:

- AdSlot
- Banner slot
- In-content slot
- Sidebar slot

Ads must not significantly damage usability.

Avoid intrusive layouts, deceptive buttons, or excessive ad density.

---

## 13. SEO

Kuro Shelf should be SEO-first.

Requirements include:

- Unique page titles
- Meta descriptions
- Canonical URLs
- Open Graph metadata
- Twitter/X metadata where appropriate
- Structured data where appropriate
- Sitemap
- robots.txt
- Clean URLs
- Server-rendered/indexable content where practical
- Proper heading hierarchy

Anime pages should have meaningful metadata rather than generic text.

---

## 14. Performance

Priorities:

- Fast initial page load
- Responsive UI
- Optimized images
- Efficient API requests
- Appropriate caching
- Avoid unnecessary client-side JavaScript
- Lazy-load expensive components
- Handle slow APIs gracefully

---

## 15. Security

Requirements:

- Never expose secrets in frontend code.
- Never commit secret environment variables.
- Validate user input.
- Protect authenticated operations.
- Prevent duplicate or unauthorized votes.
- Protect admin functionality.
- Use secure authentication practices.
- Sanitize or safely render external/user-generated content.

---

## 16. Design Direction

Brand:

# Kuro Shelf

The visual identity should communicate:

- Anime
- Manga
- Discovery
- Collection
- Community
- Modern digital library

The UI should be original.

It can take inspiration from modern anime databases and streaming services but must not reproduce another site's exact interface.

Design should prioritize:

- Clear navigation
- Strong visual hierarchy
- Poster/card layouts
- Dark-friendly visual language
- Responsive design
- Accessibility
- Fast browsing

---

## 17. Architecture Principles

Use modular architecture.

Separate:

- UI components
- Business logic
- Database access
- External API services
- Authentication
- Affiliate logic
- Analytics
- Configuration

Do not tightly couple the UI directly to Jikan.

---

## 18. Development Strategy

Build incrementally.

### Phase 1 — Foundation

- Next.js project
- TypeScript
- Tailwind
- Basic architecture
- Database setup
- Environment configuration
- Documentation
- Core layout

### Phase 2 — Anime Discovery

- Jikan integration
- Home page
- Search
- Anime listing
- Anime detail pages
- Seasonal pages
- Rankings

### Phase 3 — Accounts

- Authentication
- Profiles
- Bookmarks
- Likes
- Ratings

### Phase 4 — Community

- Disqus
- Prediction polls
- Community ratings
- Activity

### Phase 5 — Release Tracking

- Release data
- Countdown system
- Upcoming anime

### Phase 6 — Manga

- Manga discovery
- Related manga
- Amazon affiliate system

### Phase 7 — Monetization

- Advertising
- Affiliate links
- Disclosure pages

### Phase 8 — SEO and Performance

- Metadata
- Structured data
- Sitemap
- Performance optimization
- Caching

### Phase 9 — Production Readiness

- Security review
- Error handling
- Testing
- Monitoring
- Deployment
- Final UX review

---

## 19. AI Development Workflow

AI coding assistants must:

1. Read `AGENTS.md`.
2. Read relevant project documentation.
3. Inspect existing code before changing it.
4. Reuse existing components.
5. Avoid unnecessary rewrites.
6. Verify external APIs.
7. Test changes.
8. Explain what was changed.
9. Document important architectural decisions.
10. Never expose or commit secrets.

Gemini and Claude may both work on this repository.

GitHub is the source of truth.

Avoid having two AI systems simultaneously modify the same branch.

---

## 20. Current Goal

Do NOT attempt to build the entire platform in one operation.

The immediate goal is to establish a clean, maintainable project foundation and then build Kuro Shelf incrementally.

---

## 21. Backend Evolution (Supabase Migration)
The project architecture has transitioned from a primarily frontend/Jikan-driven prototype with SQLite to a production-ready **Supabase PostgreSQL** architecture. 
- **Database:** Supabase PostgreSQL is the primary database, managing the anime catalog, user profiles, and interactions.
- **Auth:** Supabase Auth is used for user authentication (Google OAuth & Email).
- **Ingestion:** An automated ingestion worker periodically pulls and normalizes data from Jikan into Supabase.
- **Frontend Access:** The UI reads primarily from the internal database (via Express APIs) to prevent rate limiting and ensure performance.
