/**
 * Raised when an AI-backed feature is requested but GEMINI_API_KEY is absent.
 * Controllers map it to HTTP 503 instead of a generic 500.
 */
export class AiUnavailableError extends Error {
  constructor(message = "AI features are not configured") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/**
 * Legacy helper kept for older call sites: returns a 503 when AI is disabled.
 */
export const respondIfAiUnavailable = (res: {
  status: (code: number) => { json: (body: unknown) => unknown };
}): boolean => {
  if (process.env.GEMINI_API_KEY) return false;

  res.status(503).json({
    message:
      "AI features are disabled on this server. Set GEMINI_API_KEY to enable them.",
  });
  return true;
};
