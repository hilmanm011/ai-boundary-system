import {
  pgTable,
  uuid,
  text,
  timestamp,
  json,
  varchar,
} from "drizzle-orm/pg-core";

export const aiDrafts = pgTable("ai_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  prompt: text("prompt").notNull(),
  context: json("context").$type<Record<string, unknown>>(),
  references: json("references").$type<string[]>(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const publishedContent = pgTable("published_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  draftId: uuid("draft_id").notNull().unique(),
  content: text("content").notNull(),
  publishedBy: text("published_by").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: varchar("action", { length: 20 }).notNull(),
  draftId: uuid("draft_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
