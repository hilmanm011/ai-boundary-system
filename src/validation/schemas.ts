import { z } from "zod";

export const generateSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, "Prompt wajib diisi"),
    userId: z.string().min(1, "User ID wajib diisi"),
  }),
});

export const draftActionSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID harus UUID yang valid"),
  }),
  body: z.object({
    userId: z.string().min(1, "User ID wajib diisi"),
  }),
});

export const draftByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID harus UUID yang valid"),
  }),
});

export const editDraftSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID harus UUID yang valid"),
  }),
  body: z.object({
    content: z.string().min(1, "Konten wajib diisi"),
    userId: z.string().min(1, "User ID wajib diisi"),
  }),
});
