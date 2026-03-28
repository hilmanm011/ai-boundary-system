import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

describe("references source type property tests", () => {
  const validSourceTypes = ["docs", "faq", "policy"];

  const referenceArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }),
    sourceType: fc.constantFrom(...validSourceTypes),
  });

  it("reference format should be sourceType:title", () => {
    fc.assert(
      fc.property(referenceArb, (ref) => {
        const formatted = `${ref.sourceType}:${ref.title}`;
        expect(formatted).toContain(":");
        expect(formatted.split(":")[0]).toBe(ref.sourceType);
      }),
    );
  });

  it("all source types should be from the valid set", () => {
    fc.assert(
      fc.property(referenceArb, (ref) => {
        expect(validSourceTypes).toContain(ref.sourceType);
      }),
    );
  });

  it("references array should map correctly from sources", () => {
    fc.assert(
      fc.property(fc.array(referenceArb, { minLength: 1 }), (refs) => {
        const formatted = refs.map((r) => `${r.sourceType}:${r.title}`);
        expect(formatted.length).toBe(refs.length);
        for (let i = 0; i < refs.length; i++) {
          expect(formatted[i]).toBe(`${refs[i]!.sourceType}:${refs[i]!.title}`);
        }
      }),
    );
  });
});
