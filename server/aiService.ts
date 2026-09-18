import { cleanOfficialText } from './officialSynopsisService';

/**
 * AI generation has been removed per user request.
 * Formats and returns official publisher text directly without Gemini API.
 */
export async function rewriteSynopsis(originalSynopsis: string | null, _title?: string): Promise<string | null> {
  return cleanOfficialText(originalSynopsis);
}
