import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  generateSchema,
  draftActionSchema,
  draftByIdSchema,
  editDraftSchema,
} from "../validation/schemas.js";
import { generateContent } from "../controllers/ai.controller.js";
import {
  listDrafts,
  getDraftById,
  editDraft,
  approveDraft,
  rejectDraft,
} from "../controllers/draft.controller.js";

const router = Router();

router.post("/generate", validate(generateSchema), generateContent);
router.get("/drafts", listDrafts);
router.get("/drafts/:id", validate(draftByIdSchema), getDraftById);
router.put("/drafts/:id", validate(editDraftSchema), editDraft);
router.post("/drafts/:id/approve", validate(draftActionSchema), approveDraft);
router.post("/drafts/:id/reject", validate(draftActionSchema), rejectDraft);

export default router;
