import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

/**
 * Property 3: AI generation hanya menulis ke ai_drafts
 * Validates: Requirements 2.1
 */

let insertedTables: any[] = [];

vi.mock("../../src/db/client.js", () => {
  const selectFrom = vi.fn();
  return {
    db: {
      select: vi.fn(() => ({ from: selectFrom })),
      insert: vi.fn((table: any) => {
        insertedTables.push(table);
        return {
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: "draft-id",
                content: "generated",
                prompt: "test",
                context: {},
                references: [],
                status: "draft",
                createdBy: "user",
                createdAt: new Date(),
              },
            ]),
          }),
        };
      }),
      __selectFrom: selectFrom,
    },
  };
});

vi.mock("../../src/services/llm-client.js", () => ({
  generate: vi.fn().mockResolvedValue("AI content"),
}));

vi.mock("../../src/services/audit-logger.js", () => ({
  log: vi.fn(),
}));

import { db } from "../../src/db/client.js";
import { aiDrafts, publishedContent } from "../../src/db/schema.js";
import { generate } from "../../src/services/content-generator.js";

describe("Property 3: AI generation only writes to ai_drafts", () => {
  it("generate never inserts into published_content", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (prompt, userId) => {
          insertedTables = [];
          const selectFrom = (db as any).__selectFrom;
          selectFrom.mockResolvedValue([]);

          await generate(prompt, userId);

          // Verify all insert calls targeted aiDrafts, never publishedContent
          for (const table of insertedTables) {
            expect(table).toBe(aiDrafts);
            expect(table).not.toBe(publishedContent);
          }

          // At least one insert should have happened (the draft)
          expect(insertedTables.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
