import { db } from "../db/client.js";
import { auditLogs } from "../db/schema.js";
import type { AuditAction } from "../types/index.js";

export async function log(
  action: AuditAction,
  draftId: string,
  userId: string,
): Promise<void> {
  await db.insert(auditLogs).values({
    action,
    draftId,
    userId,
  });
}
