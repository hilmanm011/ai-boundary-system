import { z } from "zod";

export const generateSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt is required"),
    userId: z.string().min(1, "User ID is required"),
  }),
});

export const draftActionSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID must be a valid UUID"),
  }),
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});

export const draftByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID must be a valid UUID"),
  }),
});

export const editDraftSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID must be a valid UUID"),
  }),
  body: z.object({
    content: z.string().min(1, "Content is required"),
    userId: z.string().min(1, "User ID is required"),
  }),
});
