import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { LLMError } from "../types/index.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.BASE_URL || "http://localhost:3001",
        "X-Title": "AI Boundary System",
      },
    });
  }
  return client;
}

const models = [
  "mistralai/mistral-small-2603",
  "openai/gpt-4o-mini",
  "qwen/qwen3.5-flash",
];

export async function generate(
  prompt: string,
  context: string,
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Only use the provided context. Do not hallucinate or use information outside the given context.",
    },
    {
      role: "user",
      content: `${prompt}\n\nContext:\n${context}`,
    },
  ];

  const ai = getClient();

  for (const model of models) {
    try {
      console.log(`🤖 Trying model: ${model}`);

      const completion = await ai.chat.completions.create({
        model,
        messages,
        max_tokens: 300,
      });

      const content = completion.choices?.[0]?.message?.content;

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
