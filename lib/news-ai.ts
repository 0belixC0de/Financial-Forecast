import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem, Sentiment } from "./types";

export interface NewsAnalysis {
  sentiment: Sentiment;
  summary: string;
  drivers: string[];
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function isNewsEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Ask Claude to read recent headlines and return a structured sentiment read.
 * Returns null if no API key is configured or the call fails — callers then
 * fall back to the pure math forecast.
 */
export async function analyzeNews(
  symbol: string,
  name: string,
  news: NewsItem[],
): Promise<NewsAnalysis | null> {
  if (!isNewsEnabled() || news.length === 0) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const headlines = news
    .slice(0, 8)
    .map((n, i) => `${i + 1}. ${n.title}${n.publisher ? ` (${n.publisher})` : ""}`)
    .join("\n");

  const prompt = `You are a financial news analyst. Below are recent headlines about ${name} (${symbol}).
Assess the likely near-term (7 day) sentiment for the stock based ONLY on these headlines and general market context.

Headlines:
${headlines}

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{
  "sentiment": "bullish" | "neutral" | "bearish",
  "summary": "1-2 sentence plain-English outlook",
  "drivers": ["short phrase", "short phrase"]
}`;

  try {
    const msg = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const json = extractJson(text);
    if (!json) return null;
    const parsed = JSON.parse(json);
    const sentiment: Sentiment = ["bullish", "neutral", "bearish"].includes(
      parsed.sentiment,
    )
      ? parsed.sentiment
      : "neutral";
    return {
      sentiment,
      summary: String(parsed.summary || "").slice(0, 400),
      drivers: Array.isArray(parsed.drivers)
        ? parsed.drivers.slice(0, 5).map((d: unknown) => String(d))
        : [],
    };
  } catch {
    return null;
  }
}

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
}
