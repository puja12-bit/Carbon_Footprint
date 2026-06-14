import OpenAI from "openai";
import type { EstimateResult } from "./carbon-engine.js";
import { logger } from "./logger.js";

const SYSTEM_PROMPT = `You are a carbon footprint scientist. Given a user's planned action, estimate its CO2 emissions accurately.
Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{
  "category": "string — one of: Flight, Transport, Food, Shopping, Hotel, Meeting, Streaming, General",
  "co2Kg": number — realistic total kg CO2e,
  "explanation": "string — 2-3 sentences explaining the footprint using real science",
  "confidenceScore": number — between 0.5 and 0.92,
  "factors": ["string — each factor as 'Name (XX%)' e.g. 'Fuel combustion (72%)'"],
  "alternatives": [
    {
      "label": "string — name of the greener option",
      "co2Kg": number,
      "reductionPercent": number — integer 1-99,
      "extraTimeMinutes": number or null,
      "moneySavedUsd": number or null,
      "description": "string — one sentence benefit"
    }
  ]
}
Provide 2-4 realistic lower-footprint alternatives. Be scientifically accurate and specific.`;

let _client: OpenAI | null | undefined;

function getClient(): OpenAI | null {
  if (_client !== undefined) return _client;
  const key = process.env.OPENAI_API_KEY;
  _client = key ? new OpenAI({ apiKey: key }) : null;
  return _client;
}

/** Estimate carbon using OpenAI GPT when keyword matching yields no result.
 *  Returns null if OPENAI_API_KEY is not set or the request fails. */
export async function estimateCarbonWithAI(query: string): Promise<EstimateResult | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Estimate the carbon footprint of this action: "${query}"` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Partial<EstimateResult & { category: string }>;

    if (
      typeof parsed.co2Kg !== "number" ||
      typeof parsed.category !== "string" ||
      typeof parsed.explanation !== "string" ||
      !Array.isArray(parsed.alternatives) ||
      !Array.isArray(parsed.factors)
    ) {
      logger.warn({ parsed }, "AI response missing required fields");
      return null;
    }

    return {
      action: query,
      category: parsed.category,
      co2Kg: Math.max(0, parsed.co2Kg),
      explanation: parsed.explanation,
      alternatives: parsed.alternatives.map((alt) => ({
        label: String(alt.label ?? ""),
        co2Kg: Number(alt.co2Kg ?? 0),
        reductionPercent: Number(alt.reductionPercent ?? 0),
        extraTimeMinutes: alt.extraTimeMinutes != null ? Number(alt.extraTimeMinutes) : null,
        moneySavedUsd: alt.moneySavedUsd != null ? Number(alt.moneySavedUsd) : null,
        description: alt.description != null ? String(alt.description) : null,
      })),
      confidenceScore: typeof parsed.confidenceScore === "number"
        ? Math.min(0.92, Math.max(0.5, parsed.confidenceScore))
        : 0.7,
      factors: (parsed.factors as string[]).filter((f) => typeof f === "string"),
    };
  } catch (err) {
    logger.warn({ err }, "AI carbon estimation failed — using keyword fallback");
    return null;
  }
}

/** Returns true if OPENAI_API_KEY is configured. */
export function isAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
