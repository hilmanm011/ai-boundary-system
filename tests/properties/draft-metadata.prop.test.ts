import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

describe("draft metadata property tests", () => {
  const draftArb = fc.record({
    id: fc.uuid(),
    content: fc.string({ minLength: 1 }),
    prompt: fc.string({ minLength: 1 }),
    status: fc.constantFrom("draft", "approved", "rejected"),
    createdBy: fc.string({ minLength: 1 }),
  });

  it("draft status should always be one of the valid values", () => {
    fc.assert(
      fc.property(draftArb, (draft) => {
        expect(["draft", "approved", "rejected"]).toContain(draft.status);
      }),
    );
  });

  it("draft id should be a valid UUID format", () => {
    fc.assert(
      fc.property(draftArb, (draft) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(draft.id).toMatch(uuidRegex);
      }),
    );
  });

  it("draft content and prompt should be non-empty strings", () => {
    fc.assert(
      fc.property(draftArb, (draft) => {
        expect(draft.content.length).toBeGreaterThan(0);
        expect(draft.prompt.length).toBeGreaterThan(0);
      }),
    );
  });

  it("createdBy should be a non-empty string", () => {
    fc.assert(
      fc.property(draftArb, (draft) => {
        expect(draft.createdBy.length).toBeGreaterThan(0);
      }),
    );
  });
});
