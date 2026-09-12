# Kuro Shelf — AI Development Rules

## Project
Kuro Shelf is an anime and manga discovery, tracking, and community platform.

## Source of Truth
- GitHub is the source of truth for the project.
- Always inspect the existing code before modifying it.
- Preserve existing functionality unless a change is explicitly required.
- Do not rewrite large parts of the project unnecessarily.

## Development Rules
- Use TypeScript.
- Use clean, reusable React components.
- Keep the architecture modular and maintainable.
- Prefer server-side operations for secrets and external API credentials.
- Never expose API keys, secrets, passwords, or private credentials.
- Never commit `.env` files containing secrets.

## APIs
- Kuro Shelf will use Jikan for anime and manga data.
- Do not invent API endpoints, fields, or responses.
- Verify API behavior before implementing integrations.
- Handle API failures, rate limits, missing data, and loading states gracefully.

## UI/UX
- Kuro Shelf must have original branding and UI.
- Do not copy another website's exact design.
- Make the interface responsive for mobile, tablet, and desktop.
- Prioritize accessibility and clear navigation.

## SEO
- Use semantic HTML.
- Generate proper page metadata.
- Use clean, readable URLs.
- Support canonical URLs, sitemap, robots.txt, Open Graph metadata, and structured data where appropriate.

## Performance
- Avoid unnecessary client-side JavaScript.
- Optimize images.
- Cache external API data where appropriate.
- Avoid unnecessary API requests.

## Before Making Changes
1. Read relevant project documentation.
2. Inspect existing files and architecture.
3. Understand dependencies and existing components.
4. Make the smallest clean change that solves the task.
5. Test or validate the change.
6. Report what was changed and any remaining issues.

## Git
- Do not push directly to `main` for major features.
- Use feature branches for substantial changes.
- Keep commits focused and descriptive.
- Never overwrite another developer/AI's work without understanding it first.

## Important
If a requirement is ambiguous, make the safest reasonable assumption and clearly state it.

Do not claim that something works unless it has been tested or verified.
