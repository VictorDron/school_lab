import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Middleware factory that validates specified route params are valid identifiers.
 * Accepts UUIDs and alphanumeric slugs (e.g., "general", "my-channel").
 * Rejects malicious input like SQL injection or path traversal attempts.
 */
export function validateUUID(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !UUID_REGEX.test(value) && !SAFE_ID_REGEX.test(value)) {
        return res.status(400).json({
          success: false,
          error: `Parâmetro '${param}' contém caracteres inválidos`,
        });
      }
    }
    next();
  };
}
