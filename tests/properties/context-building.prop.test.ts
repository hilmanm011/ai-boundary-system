import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

// Mock modules that have side effects on import (OpenAI client instantiation)
vi.mock("../../src/db/client.js", () => ({
  db: {},
}));

vi.mock("../../src/services/llm-client.js", () => ({
  generate: vi.fn(),
}));

vi.mock("../../src/services/audit-logger.js", () => ({
  log: vi.fn(),
}));

import { buildContext } from "../../src/services/content-generator.js";

/**
 * Property 1: Context building menyertakan semua knowledge sources
 * Validates: Requirements 1.2
 */
describe("Property 1: Context building includes all knowledge sources", () => {
  const knowledgeSourceArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    sourceType: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,19}$/),
  });

  it("buildContext output contains content from every source", () => {
    fc.assert(
      fc.property(
        fc.array(knowledgeSourceArb, { minLength: 1, maxLength: 10 }),
        (sources) => {
          const context = buildContext(sources);

          for (const source of sources) {
            expect(context).toContain(source.content);
            expect(context).toContain(source.title);
            expect(context).toContain(source.sourceType);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("buildContext formats each source as [sourceType] title:\\ncontent", () => {
    fc.assert(
      fc.property(
        fc.array(knowledgeSourceArb, { minLength: 1, maxLength: 5 }),
        (sources) => {
          const context = buildContext(sources);

          for (const source of sources) {
            const expected = `[${source.sourceType}] ${source.title}:\n${source.content}`;
            expect(context).toContain(expected);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("buildContext with empty array returns empty string", () => {
    const context = buildContext([]);
    expect(context).toBe("");
  });
});
