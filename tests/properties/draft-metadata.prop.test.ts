import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

/**
 * Property 2: Draft baru selalu memiliki status "draft" dan metadata lengkap
 * Validates: Requirements 1.3, 1.4, 2.2, 10.1-10.5
 */

// Mock modules before importing
vi.mock("../../src/db/client.js", () => {
  const selectFrom = vi.fn();
  const insertValues = vi.fn();
  return {
    db: {
      select: vi.fn(() => ({ from: selectFrom })),
      insert: vi.fn(() => ({ values: insertValues })),
      __selectFrom: selectFrom,
      __insertValues: insertValues,
    },
  };
});

vi.mock("../../src/services/llm-client.js", () => ({
  generate: vi.fn(),
}));

vi.mock("../../src/services/audit-logger.js", () => ({
  log: vi.fn(),
}));

import { db } from "../../src/db/client.js";
import * as llmClient from "../../src/services/llm-client.js";
import { generate } from "../../src/services/content-generator.js";

describe("Property 2: New drafts always have status 'draft' and complete metadata", () => {
  it("generated draft has status 'draft' and all metadata fields populated", () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (prompt, userId) => {
          // Clear mocks at the start of each iteration
          vi.clearAllMocks();

          const fakeSources = [
            {
              id: "ks-1",
              title: "Source 1",
              content: "Content 1",
              sourceType: "manual",
              createdAt: new Date(),
            },
          ];

          const fakeDraft = {
            id: "draft-uuid-123",
            content: "AI generated content",
            prompt,
            context: { sources: [{ id: "ks-1", title: "Source 1" }] },
            references: ["manual:Source 1"],
            status: "draft" as const,
            createdBy: userId,
            createdAt: new Date(),
          };

          // Setup mocks
          const selectFrom = (db as any).__selectFrom;
          selectFrom.mockResolvedValue(fakeSources);

          const insertValues = (db as any).__insertValues;
          insertValues.mockReturnValue({
            returning: vi.fn().mockResolvedValue([fakeDraft]),
          });

          vi.mocked(llmClient.generate).mockResolvedValue(
            "AI generated content",
          );

          const result = await generate(prompt, userId);

          // Property: status is always "draft"
          expect(result.status).toBe("draft");

          // Property: draftId is populated
          expect(result.draftId).toBeTruthy();

          // Property: content is populated
          expect(result.content).toBeTruthy();

          // Verify the insert was called with correct metadata
          const insertCall = insertValues.mock.calls[0]![0];
          expect(insertCall.prompt).toBe(prompt);
          expect(insertCall.createdBy).toBe(userId);
          expect(insertCall.status).toBe("draft");
          expect(insertCall.context).toBeDefined();
          expect(insertCall.references).toBeDefined();
          expect(Array.isArray(insertCall.references)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
