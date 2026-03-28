import type { Request, Response } from "express";
import * as draftManager from "../services/draft-manager.js";
import { NotFoundError, ConflictError } from "../types/index.js";

export async function listDrafts(_req: Request, res: Response): Promise<void> {
  try {
    const drafts = await draftManager.listDrafts();
    res.status(200).json(drafts);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getDraftById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const draft = await draftManager.getDraftById(id);
    res.status(200).json(draft);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function editDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { content, userId } = req.body as { content: string; userId: string };
    const updated = await draftManager.editDraft(id, content, userId);
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function approveDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };
    await draftManager.approveDraft(id, userId);
    res.status(200).json({ message: "Draft approved" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function rejectDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userId } = req.body as { userId: string };
    await draftManager.rejectDraft(id, userId);
    res.status(200).json({ message: "Draft rejected" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
