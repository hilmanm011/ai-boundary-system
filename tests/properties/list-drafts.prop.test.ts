import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

/**
 * Property 4: List drafts mengembalikan semua draft dengan field lengkap
 * Validates: Requirements 3.1, 3.2
 */

vi.mock("../../src/db/client.js", () => {
  const selectFrom = vi.fn();
  return {
    db: {
      select: vi.fn(() => ({ from: selectFrom })),
      __selectFrom: selectFrom,
    },
  };
});

import { db } from "../../src/db/client.js";
import { listDrafts } from "../../src/services/draft-manager.js";

const draftArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  prompt: fc.string({ minLength: 1, maxLength: 200 }),
  context: fc.constant({ sources: [] } as Record<string, unknown>),
  references: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    maxLength: 5,
  }),
  status: fc.constantFrom("draft", "approved", "rejected"),
  createdBy: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: fc.date(),
});

describe("Property 4: List drafts returns all drafts with complete fields", () => {
  it("listDrafts returns exactly N items with all required fields", () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(draftArb, { minLength: 0, maxLength: 20 }),
        async (drafts) => {
          vi.clearAllMocks();

          const selectFrom = (db as any).__selectFrom;
          selectFrom.mockResolvedValue(drafts);

          const result = await listDrafts();

          // Property: returns exactly N items
          expect(result).toHaveLength(drafts.length);

          // Property: every item has all required fields
          const requiredFields = [
            "id",
            "content",
            "prompt",
            "context",
            "references",
            "status",
            "createdBy",
            "createdAt",
          ] as const;

          for (const item of result) {
            for (const field of requiredFields) {
              expect(item).toHaveProperty(field);
              expect(
                (item as Record<string, unknown>)[field],
              ).not.toBeUndefined();
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
