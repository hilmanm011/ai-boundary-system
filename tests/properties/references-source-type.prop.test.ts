import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

/**
 * Property 11: References menyertakan source_type dari knowledge sources
 * Validates: Requirements 11.3
 */

let capturedInsertValues: any = null;

vi.mock("../../src/db/client.js", () => {
  const selectFrom = vi.fn();
  return {
    db: {
      select: vi.fn(() => ({ from: selectFrom })),
      insert: vi.fn(() => ({
        values: vi.fn((vals: any) => {
          capturedInsertValues = vals;
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: "draft-id",
                content: "generated",
                prompt: "test",
                context: {},
                references: vals?.references ?? [],
                status: "draft",
                createdBy: vals?.createdBy ?? "user",
                createdAt: new Date(),
              },
            ]),
          };
        }),
      })),
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
import { generate } from "../../src/services/content-generator.js";

const sourceTypeArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,19}$/);

const knowledgeSourceArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  sourceType: sourceTypeArb,
  createdAt: fc.date(),
});

describe("Property 11: References include source_type from knowledge sources", () => {
  it("references field contains source_type from each knowledge source", () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(knowledgeSourceArb, { minLength: 1, maxLength: 10 }),
        async (sources) => {
          capturedInsertValues = null;

          const selectFrom = (db as any).__selectFrom;
          selectFrom.mockResolvedValue(sources);

          await generate("test prompt", "user-1");

          // Verify the values passed to insert contain references with source_type
          expect(capturedInsertValues).toBeDefined();
          expect(Array.isArray(capturedInsertValues.references)).toBe(true);

          // Each reference should be formatted as "sourceType:title"
          // and should contain the source_type from the knowledge source
          for (const source of sources) {
            const hasSourceType = capturedInsertValues.references.some(
              (ref: string) => ref.startsWith(`${source.sourceType}:`),
            );
            expect(hasSourceType).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
