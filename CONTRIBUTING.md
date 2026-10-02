# Contributing to Kuro Shelf

Thank you for your interest in contributing to **Kuro Shelf**! This project is a community-driven anime and manga discovery and tracking platform built with TypeScript, React 18, Vite, Tailwind CSS v4, Express, and Supabase.

## Code of Conduct

Please help maintain a welcoming, respectful, and productive environment. Harassment or offensive language will not be tolerated.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/kuroshelf.git
   cd kuroshelf
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure your environment**:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase URL and anonymous key (optional for basic frontend exploration, required for account sync and custom shelf persistence).
5. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Guidelines

- **TypeScript**: Strictly typed codebase. Do not use `any` when avoidable; declare clean interfaces in `src/types.ts`.
- **Styling**: Tailwind CSS v4 utility classes. Keep styles modular, accessible, and responsive for mobile, tablet, and desktop viewports.
- **Components**: Follow the functional React component pattern with hooks. Keep components focused, self-contained, and clean.
- **API Standards**:
  - Anime data uses the Jikan REST API (v4).
  - Books and Manga data uses AniList GraphQL API.
  - Implement caching, rate-limit resilience, and loading states for all external queries.
- **Code Quality**:
  - Run `npm run lint` before committing to ensure there are no TypeScript or compilation errors.
  - Test locally with `npm run build` to verify the full production build.

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(mobile): add hardware-accelerated drawer transitions"
   ```
3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request on GitHub with a concise summary of the problem, the solution, and any relevant screenshots.

Thank you for helping make Kuro Shelf better!
