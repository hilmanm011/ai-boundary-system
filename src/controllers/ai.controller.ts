import type { Request, Response } from "express";
import * as contentGenerator from "../services/content-generator.js";
import { LLMError } from "../types/index.js";

export async function generateContent(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { prompt, userId } = req.body as {
      prompt: string;
      userId: string;
    };
    const result = await contentGenerator.generate(prompt, userId);
    res.status(200).json(result);
  } catch (error) {
    console.log("ERROR: ", error);

    if (error instanceof LLMError) {
      res.status(502).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
