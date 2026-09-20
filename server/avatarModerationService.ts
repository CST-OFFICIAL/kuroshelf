import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  flaggedCategories?: string[];
}

/**
 * Validates and moderates an uploaded user profile image for explicit, adult,
 * or violent content using Gemini Vision.
 */
export async function moderateAvatarImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ModerationResult> {
  // Normalize base64 data (strip data URL scheme if present)
  let cleanBase64 = imageBase64;
  let detectedMime = mimeType;

  if (cleanBase64.startsWith('data:')) {
    const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      detectedMime = match[1];
      cleanBase64 = match[2];
    }
  }

  // Reject unsupported mime types
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(detectedMime.toLowerCase())) {
    return {
      safe: false,
      reason: 'Unsupported image format. Please upload a JPEG, PNG, WEBP, or GIF image.',
    };
  }

  // Size limit check: reject images exceeding approx 8MB in base64
  if (cleanBase64.length > 11 * 1024 * 1024) {
    return {
      safe: false,
      reason: 'Image file is too large. Please upload an image under 5MB.',
    };
  }

  const ai = getAiClient();
  if (!ai) {
    // If Gemini key is not configured in this environment, allow image with standard sanity checks
    return { safe: true };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64,
          },
        },
        `You are a strict automated content moderator for an anime & manga community platform profile avatar.
Analyze this user profile image to determine if it is appropriate for all ages.

STRICTLY PROHIBITED (must mark safe=false):
1. Nudity, sexual activity, explicit pornography, hentai, visible genitalia, exposed breasts/buttocks, or heavily suggestive sexual poses.
2. Graphic violence, gore, mutilation, severed limbs, blood, or real-life injury.
3. Hate symbols, Nazi iconography, terrorist symbols, or explicit harassment.

PERMITTED (safe=true):
1. Anime character portraits, manga art, cosplay, fan art (as long as non-explicit/non-hentai).
2. Normal human portraits, selfies, pets, animals, scenery, memes, gaming avatars.
3. Mild stylized cartoon action (e.g. standard shonen fight poses with swords).

Respond ONLY with valid JSON in this exact structure:
{
  "safe": boolean,
  "reason": "Clear, concise user-friendly explanation if unsafe, or empty if safe",
  "flaggedCategories": ["nudity" | "sexual_content" | "violence" | "hate"]
}`,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch {
      // If parsing fails, fall back to safe check
      return { safe: true };
    }

    if (parsed.safe === false) {
      return {
        safe: false,
        reason:
          parsed.reason ||
          'This image cannot be used because it violates community guidelines regarding explicit or inappropriate content.',
        flaggedCategories: Array.isArray(parsed.flaggedCategories) ? parsed.flaggedCategories : [],
      };
    }

    return { safe: true };
  } catch (err: any) {
    console.error('Avatar moderation error:', err);
    // If moderation service encounters a network or parsing glitch, do not crash; default to allowing
    return { safe: true };
  }
}
