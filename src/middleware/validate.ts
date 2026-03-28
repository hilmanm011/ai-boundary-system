import type { Request, Response, NextFunction } from "express";
import type { ZodObject, ZodRawShape } from "zod";

export function validate(schema: ZodObject<ZodRawShape>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    next();
  };
}
