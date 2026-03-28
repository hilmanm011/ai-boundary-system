import { db } from "../db/client.js";
import { aiDrafts, publishedContent } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../types/index.js";
import * as auditLogger from "./audit-logger.js";

export async function listDrafts() {
  return db.select().from(aiDrafts);
}

export async function getDraftById(draftId: string) {
  const draft = await db.query.aiDrafts.findFirst({
    where: eq(aiDrafts.id, draftId),
  });
  if (!draft) throw new NotFoundError(`Draft with id ${draftId} not found`);
  return draft;
}

export async function editDraft(
  draftId: string,
  content: string,
  userId: string,
) {
  const draft = await db.query.aiDrafts.findFirst({
    where: eq(aiDrafts.id, draftId),
  });

  if (!draft) throw new NotFoundError(`Draft with id ${draftId} not found`);
  if (draft.status !== "draft") {
    throw new ConflictError(`Draft already ${draft.status}, cannot edit`);
  }

  const [updated] = await db
    .update(aiDrafts)
    .set({ content })
    .where(eq(aiDrafts.id, draftId))
    .returning();

  return updated;
}

export async function approveDraft(
  draftId: string,
  userId: string,
): Promise<void> {
  const draft = await db.query.aiDrafts.findFirst({
    where: eq(aiDrafts.id, draftId),
  });

  if (!draft) throw new NotFoundError(`Draft with id ${draftId} not found`);
  if (draft.status !== "draft") {
    throw new ConflictError(`Draft already ${draft.status}, cannot approve`);
  }

  await db.transaction(async (tx) => {
    await tx.insert(publishedContent).values({
      draftId: draft.id,
      content: draft.content,
      publishedBy: userId,
    });

    await tx
      .update(aiDrafts)
      .set({ status: "approved" })
      .where(eq(aiDrafts.id, draftId));
  });

  await auditLogger.log("approved", draftId, userId);
}

export async function rejectDraft(
  draftId: string,
  userId: string,
): Promise<void> {
  const draft = await db.query.aiDrafts.findFirst({
    where: eq(aiDrafts.id, draftId),
  });

  if (!draft) throw new NotFoundError(`Draft with id ${draftId} not found`);
  if (draft.status !== "draft") {
    throw new ConflictError(`Draft already ${draft.status}, cannot reject`);
  }

  await db
    .update(aiDrafts)
    .set({ status: "rejected" })
    .where(eq(aiDrafts.id, draftId));

  await auditLogger.log("rejected", draftId, userId);
}
