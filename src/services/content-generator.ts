import { db } from "../db/client.js";
import { aiDrafts, knowledgeSources } from "../db/schema.js";
import * as llmClient from "./llm-client.js";
import * as auditLogger from "./audit-logger.js";

interface GenerateResult {
  draftId: string;
  content: string;
  status: "draft";
}

export function buildContext(
  sources: { title: string; content: string; sourceType: string }[],
): string {
  return sources
    .map((s) => `[${s.sourceType}] ${s.title}:\n${s.content}`)
    .join("\n\n");
}

export async function generate(
  prompt: string,
  userId: string,
): Promise<GenerateResult> {
  const sources = await db.select().from(knowledgeSources);

  const context = buildContext(sources);

  const content = await llmClient.generate(prompt, context);

  const references = sources.map((s) => ({
    id: s.id,
    title: s.title,
    sourceType: s.sourceType,
  }));

  const [draft] = await db
    .insert(aiDrafts)
    .values({
      content,
      prompt,
      context: { sources: sources.map((s) => ({ id: s.id, title: s.title })) },
      references: references.map((r) => `${r.sourceType}:${r.title}`),
      status: "draft",
      createdBy: userId,
    })
    .returning();

  if (!draft) throw new Error("Failed to save draft");

  await auditLogger.log("created", draft.id, userId);

  return {
    draftId: draft.id,
    content: draft.content,
    status: "draft",
  };
}
