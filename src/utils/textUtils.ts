/**
 * Utility functions for text formatting and sanitization across KuroShelf.
 */

/**
 * Cleans and sanitizes raw anime/manga synopsis text from external APIs (Jikan, AniList, MAL).
 * - Strips raw HTML tags (<br>, <br/>, <i>, <b>, <span>, etc.)
 * - Decodes HTML entities (&quot;, &#039;, &amp;, &mdash;, etc.)
 * - Strips automated metadata tags (e.g. [Written by MAL Rewrite], (Source: Crunchyroll))
 * - Cleans up spacing, ensures Note sections break properly, and preserves clean paragraphs.
 */
export function cleanSynopsis(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;|&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&hellip;|&#8230;/g, '…')
    .replace(/\(Source:[^)]*\)/gi, '')
    .replace(/\[Source:[^\]]*\]/gi, '')
    .replace(/\[Written by MAL Rewrite\]/gi, '')
    .replace(/\(Written by MAL Rewrite\)/gi, '')
    .replace(/([.!?])\s*(Notes?:)/gi, '$1\n\n$2');

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.join('\n\n').trim();
}
