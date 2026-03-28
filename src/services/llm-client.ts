/* eslint-disable @typescript-eslint/no-explicit-any */
import { LLMError } from "../types/index.js";

let client: any = null;

async function getClient(): Promise<any> {
  if (!client) {
    const mod = await import("openai");
    const OpenAI = (mod as any).default ?? mod;
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.BASE_URL || "http://localhost:3001",
        "X-OpenRouter-Title": "AI Boundary System",
      },
    });
  }
  return client;
}

const models = [
  "mistralai/mistral-small-2603",
  "openai/gpt-5.4-pro",
  "qwen/qwen3.5-flash-02-23",
  "google/gemini-3.1-pro-preview-customtools",
  "openai/gpt-5.3-codex",
];

export async function generate(
  prompt: string,
  context: string,
): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content:
        "Only use the provided context to answer. Do not hallucinate or use information outside the given context.",
    },
    {
      role: "user" as const,
      content: `${prompt}\n\nContext:\n${context}`,
    },
  ];

  const openai = await getClient();

  for (const model of models) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message.content;
      if (content) {
        console.log(`✅ Model ${model} responded successfully`);
        return content;
      }
    } catch (error) {
      console.error(`❌ Model ${model} failed:`, (error as Error).message);
      continue;
    }
  }

  throw new LLMError("All LLM models failed to generate a response");
}
