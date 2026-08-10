import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function anthropicClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }
  client = new Anthropic({ apiKey });
  return client;
}

const VISION_MODEL = process.env.ANTHROPIC_VISION_MODEL || "claude-sonnet-5";

export interface SpineCandidate {
  title: string;
  author: string | null;
  raw_text: string;
  confidence: "high" | "low";
  box: { x: number; y: number; w: number; h: number };
}

const SYSTEM_PROMPT = `You are helping catalog a home bookshelf from a single photo. Identify every visible book spine, left to right, top to bottom if there are multiple shelves in view.

For each book spine:
- Give your best-guess title and author, even if the spine is faded, worn, embossed, in an antique typeface, or partially illegible. NEVER skip a spine just because you're unsure — always provide a best guess.
- Mark "confidence" as "high" only if you are confident the title/author reading is correct. Mark it "low" for anything faded, embossed with no color contrast, partially obscured, blurry, or where you are guessing from only a few legible letters.
- "raw_text" should be exactly what you can visually make out on the spine (even fragments like "...ILL Y'S PROG..."), not your interpreted guess.
- "box" is the approximate bounding box of that spine within the image, as fractions of the image width/height (0 to 1), with x/y as the top-left corner.

Respond with ONLY a JSON array (no prose, no markdown fences) of objects matching this shape:
[{"title": string, "author": string | null, "raw_text": string, "confidence": "high" | "low", "box": {"x": number, "y": number, "w": number, "h": number}}]`;

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Claude vision response did not contain a JSON array.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function identifySpinesFromImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<SpineCandidate[]> {
  const anthropic = anthropicClient();

  const message = await anthropic.messages.create({
    model: VISION_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "Identify every book spine in this bookshelf photo and return the JSON array as instructed.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude vision response had no text content.");
  }

  const parsed = extractJsonArray(textBlock.text);
  if (!Array.isArray(parsed)) {
    throw new Error("Claude vision response JSON was not an array.");
  }

  return parsed
    .filter(
      (item): item is SpineCandidate =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SpineCandidate).title === "string"
    )
    .map((item) => ({
      title: item.title,
      author: item.author ?? null,
      raw_text: item.raw_text ?? item.title,
      confidence: item.confidence === "high" ? "high" : "low",
      box: {
        x: clamp01(item.box?.x),
        y: clamp01(item.box?.y),
        w: clamp01(item.box?.w),
        h: clamp01(item.box?.h),
      },
    }));
}

function clamp01(n: unknown): number {
  const num = typeof n === "number" ? n : 0;
  if (Number.isNaN(num)) return 0;
  return Math.min(1, Math.max(0, num));
}

export interface RecommendationSuggestion {
  title: string;
  author: string;
  reason: string;
}

const RECOMMEND_SYSTEM_PROMPT = `You are a friendly, well-read librarian helping someone find a book. Given a natural-language request (a mood, topic, or vague description) and a list of that person's own catalogued books (title/author), respond with ONLY a JSON object (no prose, no markdown fences) of this shape:

{"fromLibrary": [{"title": string, "author": string, "reason": string}], "suggestions": [{"title": string, "author": string, "reason": string}]}

"fromLibrary" should only include books that are genuinely good matches for the request, pulled from the provided catalog list (empty array if nothing fits well). "suggestions" should be 3-5 real, existing books (not from their catalog) that match the request well, each with a one-sentence "reason" explaining why it fits. Keep reasons short, warm, and specific.`;

export async function recommendBooks(
  query: string,
  catalog: { title: string; author: string | null }[]
): Promise<{
  fromLibrary: RecommendationSuggestion[];
  suggestions: RecommendationSuggestion[];
}> {
  const anthropic = anthropicClient();
  const catalogText = catalog
    .slice(0, 500)
    .map((b) => `- ${b.title}${b.author ? ` by ${b.author}` : ""}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: VISION_MODEL,
    max_tokens: 1500,
    system: RECOMMEND_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Request: "${query}"\n\nMy catalog:\n${catalogText || "(empty)"}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { fromLibrary: [], suggestions: [] };
  }

  try {
    const trimmed = textBlock.text.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return {
      fromLibrary: Array.isArray(parsed.fromLibrary) ? parsed.fromLibrary : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return { fromLibrary: [], suggestions: [] };
  }
}
