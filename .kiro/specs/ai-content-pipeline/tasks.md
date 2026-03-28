# Implementation Plan: AI Content Pipeline

## Overview

Implement an AI content generation pipeline with draft approval workflow. The plan starts by fixing the broken ESM/CJS module system and existing bugs, then builds out the new schema, services, controllers, routes, and validation layer incrementally. Each step builds on the previous one so there is no orphaned code.

## Tasks

- [x] 1. Fix project foundation: ESM module system, tsconfig, and dependencies
  - [x] 1.1 Update package.json: change "type" to "module", add openai to dependencies, add @types/pg, @types/node, tsx, fast-check, vitest to devDependencies, replace ts-node-dev with tsx in scripts, add "test": "vitest --run" script
    - _Requirements: 1.1, 1.2 (openai needed for LLM), 12.1 (zod already present)_
  - [x] 1.2 Rewrite tsconfig.json per design: set rootDir, outDir, add "types": ["node"], "lib": ["esnext"], remove jsx, exactOptionalPropertyTypes, noUncheckedSideEffectImports
    - _Requirements: prerequisite for all code to compile_
  - [x] 1.3 Fix src/db/client.ts: import pg as default ESM import, pass { schema } to drizzle(), add .js extension on relative import of schema
    - This fixes the db.query.aiDrafts bug in publish/service.ts
    - _Requirements: 3.1, 4.1 (query and transaction support needed)_

- [x] 2. Update`database schema and shared types`
  - [x] 2.1 Update src/db/schema.ts: add notNull() constraints to aiDrafts fields (content, prompt, status, createdBy, createdAt), add $type on JSON fields (context, references), add notNull().unique() on publishedContent.draftId, add notNull() to other publishedContent fields
    - _Requirements: 2.2, 7.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 2.2 Add knowledgeSources table to src/db/schema.ts with fields: id (UUID PK), title (text notNull), content (text notNull), sourceType (varchar notNull), createdAt (timestamp notNull)
    - _Requirements: 11.1_
  - [x] 2.3 Add auditLogs table to src/db/schema.ts with fields: id (UUID PK), action (varchar notNull), draftId (uuid notNull), userId (text notNull), createdAt (timestamp notNull)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 2.4 Create src/types/index.ts with shared TypeScript types and custom error classes (NotFoundError, ConflictError, LLMError) as defined in the design
    - _Requirements: 4.5, 4.6, 5.4, 5.5, 1.5_

- [x] 3. Checkpoint - Ensure project compiles
  - Ensure all files compile without ESM/CJS errors, ask the user if questions arise.

- [x] 4. Implement service layer
  - [x] 4.1 Create src/services/llm-client.ts: OpenAI SDK wrapper for OpenRouter with model fallback, system prompt constraining AI to context, returns string or throws LLMError
    - Replace the broken src/modules/ai/service.ts (unreachable code, undefined messages variable)
    - _Requirements: 1.2, 1.5_
  - [x] 4.2 Create src/services/audit-logger.ts: implement log(action, draftId, userId) that inserts into audit_logs table
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 4.3 Create src/services/content-generator.ts: implement generate(prompt, userId) — fetch knowledge sources, build context, call LLM, save draft with full metadata, log audit "created", return draft info
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 10.1-10.5, 11.2, 11.3_
  - [x] 4.4 Create src/services/draft-manager.ts: implement listDrafts(), approveDraft(draftId, userId), rejectDraft(draftId, userId) with strict state machine, database transaction for approve, audit logging, proper error throwing
    - Replace the broken src/modules/publish/service.ts
    - _Requirements: 3.1-3.3, 4.1-4.6, 5.1-5.5, 6.1-6.4, 7.1-7.4, 8.1-8.4, 9.2, 9.3_
  - [ ]\* 4.5 Write property test: State machine only allows valid transitions
    - Property 5: State machine hanya mengizinkan transisi valid
    - Generate random (currentStatus, targetAction) pairs, verify only (draft,approve) and (draft,reject) succeed
    - Validates: Requirements 6.1, 6.2, 6.3, 4.2, 4.6, 5.2, 5.5
  - [ ]\* 4.6 Write property test: Approve produces consistent published_content
    - Property 6: Approve menghasilkan published_content yang konsisten
    - For any approved draft, verify published_content has one new record with matching draft_id, same content, correct published_by
    - Validates: Requirements 4.3, 4.4
  - [ ]\* 4.7 Write property test: Operations on non-existent drafts return 404
    - Property 7: Operasi pada draft yang tidak ada mengembalikan 404
    - Generate random UUIDs not in database, verify approve and reject throw NotFoundError
    - Validates: Requirements 4.5, 5.4
  - [ ]\* 4.8 Write property test: Operations on processed drafts don't change data
    - Property 8: Operasi pada draft yang sudah diproses tidak mengubah data
    - For any already-processed draft, verify re-processing throws ConflictError and database state unchanged
    - Validates: Requirements 7.1, 7.2, 7.3, 7.4
  - [ ]\* 4.9 Write property test: Every action produces an audit log entry
    - Property 9: Setiap aksi menghasilkan audit log entry
    - For any action (create, approve, reject), verify audit_logs has new entry with correct fields
    - Validates: Requirements 9.1, 9.2, 9.3

- [x] 5. Checkpoint - Ensure services compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement validation, middleware, controllers, and routes
  - [x] 6.1 Create src/validation/schemas.ts: Zod schemas for generateSchema (body: prompt string min 1, userId string min 1) and draftActionSchema (params: id UUID, body: userId string min 1)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 1.6_
  - [x] 6.2 Create src/middleware/validate.ts: generic Zod validation middleware that validates req.body and req.params, returns 400 with field-level error details on failure
    - _Requirements: 12.4_
  - [x] 6.3 Create src/controllers/ai.controller.ts: generateContent handler calling ContentGenerator, maps errors to HTTP status codes (400, 502, 500)
    - _Requirements: 1.1, 1.5, 1.6_
  - [x] 6.4 Create src/controllers/draft.controller.ts: listDrafts, approveDraft, rejectDraft handlers calling DraftManager, maps errors to HTTP status codes (404, 409, 500)
    - _Requirements: 3.1, 3.3, 4.1, 4.5, 4.6, 5.1, 5.4, 5.5_
  - [x] 6.5 Create src/routes/ai.routes.ts: wire POST /ai/generate, GET /ai/drafts, POST /ai/drafts/:id/approve, POST /ai/drafts/:id/reject with validation middleware and controllers
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 12.1, 12.2, 12.3_
  - [x] 6.6 Update src/index.ts: import and mount AI routes, remove old placeholder route, ensure dotenv is loaded
    - _Requirements: prerequisite for all endpoints to work_
  - [ ]\* 6.7 Write property test: Invalid input rejected with 400 and error details
    - Property 10: Invalid input ditolak dengan 400 dan detail error
    - Generate random invalid inputs (empty prompt, non-UUID id, missing userId), verify 400 with field-level error info
    - Validates: Requirements 12.1, 12.2, 12.3, 12.4, 1.6

- [x] 7. Checkpoint - Ensure all routes work and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Remaining property tests for content generation
  - [x]\* 8.1 Write property test: Context building includes all knowledge sources
    - Property 1: Context building menyertakan semua knowledge sources
    - Generate random arrays of knowledge source objects, verify buildContext output contains content from every source
    - Validates: Requirements 1.2
  - [x]\* 8.2 Write property test: New drafts always have status "draft" and complete metadata
    - Property 2: Draft baru selalu memiliki status "draft" dan metadata lengkap
    - Generate random valid prompts and userIds, create draft, verify status is "draft" and all metadata fields populated
    - Validates: Requirements 1.3, 1.4, 2.2, 10.1-10.5
  - [x]\* 8.3 Write property test: AI generation only writes to ai_drafts
    - Property 3: AI generation hanya menulis ke ai_drafts
    - For any generate operation, verify published_content count unchanged before and after
    - Validates: Requirements 2.1
  - [x]\* 8.4 Write property test: List drafts returns all drafts with complete fields
    - Property 4: List drafts mengembalikan semua draft dengan field lengkap
    - Insert random N drafts, call listDrafts, verify exactly N items returned with all required fields
    - Validates: Requirements 3.1, 3.2
  - [x]\* 8.5 Write property test: References include source_type from knowledge sources
    - Property 11: References menyertakan source_type dari knowledge sources
    - Generate random knowledge sources with various source_types, create draft, verify references contains source_type
    - Validates: Requirements 11.3

- [x] 9. Clean up old modules and final wiring
  - [x] 9.1 Delete src/modules/ directory (ai/service.ts and publish/service.ts replaced by new services)
    - All functionality now lives in src/services/, src/controllers/, src/routes/
    - _Requirements: 2.3 (no code path allows AI to write directly to published_content)_

- [x] 10. Final checkpoint - Ensure all tests pass and project compiles cleanly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks with \* after the checkbox are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with vitest, minimum 100 iterations per property
- The design uses TypeScript throughout, all implementation is in TypeScript
- Checkpoints ensure incremental validation at key milestones
