import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildContext } from "../../src/services/content-generator.js";

describe("buildContext property tests", () => {
  const sourceArb = fc.record({
    title: fc.string({ minLength: 1 }),
    content: fc.string({ minLength: 1 }),
    sourceType: fc.constantFrom("docs", "faq", "policy"),
  });

  it("should include all source titles in the context", () => {
    fc.assert(
      fc.property(fc.array(sourceArb, { minLength: 1 }), (sources) => {
        const context = buildContext(sources);
        for (const source of sources) {
          expect(context).toContain(source.title);
        }
      }),
    );
  });

  it("should include all source content in the context", () => {
    fc.assert(
      fc.property(fc.array(sourceArb, { minLength: 1 }), (sources) => {
        const context = buildContext(sources);
        for (const source of sources) {
          expect(context).toContain(source.content);
        }
      }),
    );
  });

  it("should include source type tags in brackets", () => {
    fc.assert(
      fc.property(fc.array(sourceArb, { minLength: 1 }), (sources) => {
        const context = buildContext(sources);
        for (const source of sources) {
          expect(context).toContain(`[${source.sourceType}]`);
        }
      }),
    );
  });

  it("should return empty string for empty sources", () => {
    expect(buildContext([])).toBe("");
  });

  it("should separate multiple sources with double newlines", () => {
    fc.assert(
      fc.property(
        fc.array(sourceArb, { minLength: 2, maxLength: 5 }),
        (sources) => {
          const context = buildContext(sources);
          const separatorCount = (context.match(/\n\n/g) || []).length;
          expect(separatorCount).toBeGreaterThanOrEqual(sources.length - 1);
        },
      ),
    );
  });
});
