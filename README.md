# AI Boundary System

Backend system for AI-powered content generation with a draft review mechanism (approve/reject) before publishing. Built with Express.js, Drizzle ORM, PostgreSQL, and OpenRouter as the LLM provider.

## Tech Stack

- Runtime: Node.js + TypeScript (ESM)
- Framework: Express 5
- Database: PostgreSQL (via Supabase)
- ORM: Drizzle ORM
- LLM Provider: OpenRouter (multi-model fallback)
- Validation: Zod
- Testing: Vitest + fast-check (property-based testing)

## Architecture

```
src/
├── controllers/       # Request handlers (ai, draft)
├── db/                # Database client & schema (Drizzle)
├── middleware/         # Validation middleware (Zod)
├── routes/            # Express route definitions
├── services/          # Business logic
│   ├── audit-logger       # Logs actions to audit_logs
│   ├── content-generator  # Generates content via LLM + saves draft
│   ├── draft-manager      # Approve/reject/edit drafts
│   └── llm-client         # OpenRouter API client (multi-model fallback)
├── types/             # Custom error classes & shared types
├── utils/
├── validation/        # Zod schemas for request validation
└── index.ts           # Entry point
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@host:port/database"
OPENROUTER_API_KEY=sk-or-v1-xxxxx
BASE_URL=
```

### 3. Push database schema

```bash
npx drizzle-kit push
```

### 4. Seed knowledge sources (optional)

```bash
npx tsx src/db/seed.ts
```

### 5. Start development server

```bash
npm run dev
```

## Database Schema

### `ai_drafts`

| Column     | Type        | Description                       |
| ---------- | ----------- | --------------------------------- |
| id         | UUID (PK)   | Auto-generated                    |
| content    | TEXT        | AI-generated content              |
| prompt     | TEXT        | User's original prompt            |
| context    | JSON        | Knowledge sources used            |
| references | JSON        | Array of `sourceType:title` refs  |
| status     | VARCHAR(20) | `draft` / `approved` / `rejected` |
| created_by | TEXT        | User ID of the creator            |
| created_at | TIMESTAMP   | Creation timestamp                |

### `published_content`

| Column       | Type      | Description            |
| ------------ | --------- | ---------------------- |
| id           | UUID (PK) | Auto-generated         |
| draft_id     | UUID (UQ) | Reference to ai_drafts |
| content      | TEXT      | Published content      |
| published_by | TEXT      | User ID who approved   |
| published_at | TIMESTAMP | Publication timestamp  |

### `knowledge_sources`

| Column      | Type        | Description                  |
| ----------- | ----------- | ---------------------------- |
| id          | UUID (PK)   | Auto-generated               |
| title       | TEXT        | Source title                 |
| content     | TEXT        | Source content               |
| source_type | VARCHAR(50) | Source type (e.g. docs, faq) |
| created_at  | TIMESTAMP   | Creation timestamp           |

### `audit_logs`

| Column     | Type        | Description                         |
| ---------- | ----------- | ----------------------------------- |
| id         | UUID (PK)   | Auto-generated                      |
| action     | VARCHAR(20) | `created` / `approved` / `rejected` |
| draft_id   | UUID        | Reference to draft                  |
| user_id    | TEXT        | User who performed the action       |
| created_at | TIMESTAMP   | Action timestamp                    |

## API Endpoints

Base URL: `/ai`

### 1. Generate AI Content

```
POST /ai/generate
```

Generates content from an LLM based on a prompt and available knowledge sources. The result is saved as a draft.

Request body:

```json
{
  "prompt": "Explain feature X",
  "userId": "user-123"
}
```

Response `200`:

```json
{
  "draftId": "uuid",
  "content": "AI-generated content...",
  "status": "draft"
}
```

Errors: `400` Validation error · `502` All LLM models failed · `500` Internal server error

---

### 2. List All Drafts

```
GET /ai/drafts
```

Returns all drafts in the database.

Response `200`:

```json
[
  {
    "id": "uuid",
    "content": "...",
    "prompt": "...",
    "context": { "sources": [] },
    "references": ["docs:Title A", "faq:Title B"],
    "status": "draft",
    "createdBy": "user-123",
    "createdAt": "2026-03-28T..."
  }
]
```

---

### 3. Get Draft by ID

```
GET /ai/drafts/:id
```

Returns a single draft by its UUID.

Response `200`: Draft object

Errors: `400` Invalid UUID · `404` Draft not found · `500` Internal server error

---

### 4. Edit Draft

```
PUT /ai/drafts/:id
```

Edit the content of a draft. Only drafts with status `draft` can be edited.

Request body:

```json
{
  "content": "Revised content by reviewer",
  "userId": "reviewer-456"
}
```

Response `200`: Updated draft object

Errors: `400` Validation error · `404` Draft not found · `409` Draft already approved/rejected · `500` Internal server error

---

### 5. Approve Draft

```
POST /ai/drafts/:id/approve
```

Approves a draft and publishes its content. Draft must have status `draft`.

Request body:

```json
{
  "userId": "reviewer-456"
}
```

Response `200`:

```json
{
  "message": "Draft approved"
}
```

Errors: `400` Validation error · `404` Draft not found · `409` Draft already approved/rejected · `500` Internal server error

---

### 6. Reject Draft

```
POST /ai/drafts/:id/reject
```

Rejects a draft. Draft must have status `draft`.

Request body:

```json
{
  "userId": "reviewer-456"
}
```

Response `200`:

```json
{
  "message": "Draft rejected"
}
```

Errors: `400` Validation error · `404` Draft not found · `409` Draft already approved/rejected · `500` Internal server error

## Workflow

```
1. User sends a prompt via POST /ai/generate
2. System fetches all knowledge_sources from DB
3. Context is built from sources and sent to the LLM (OpenRouter)
4. LLM generates content (falls back to next model on failure)
5. Result is saved as a draft (status: "draft") + audit log "created"
6. Reviewer can GET /ai/drafts to view all drafts
7. Reviewer can GET /ai/drafts/:id to view a specific draft
8. Reviewer can PUT /ai/drafts/:id to edit the content before deciding
9. Reviewer approves → content goes to published_content + audit log "approved"
   Reviewer rejects → status changes to "rejected" + audit log "rejected"
```

## LLM Fallback Strategy

The system uses OpenRouter with a multi-model fallback strategy. If the primary model fails, it automatically tries the next one. If all models fail, it returns HTTP 502.

The system prompt ensures the LLM only uses the provided context and does not hallucinate information.

## Testing

```bash
npm test
```

Uses property-based testing with fast-check. Test files are in `tests/properties/`.

## License

ISC
